import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { handleSendOtpJob, handleSendOrderConfirmationJob, handleSyncOrdersJob } from './jobs';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

class SafeQueue {
  private queue: Queue | null = null;
  private isFallback = false;

  constructor() {
    try {
      // Create IORedis connection with error handling to avoid crash
      const connection = new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
        connectTimeout: 2000,
        lazyConnect: true
      });

      connection.on('error', (err) => {
        if (!this.isFallback) {
          console.warn('[Queue] Connection failed. Using in-memory job execution fallback.', err.message);
          this.isFallback = true;
        }
      });

      connection.on('connect', () => {
        console.log('[Queue] Connected successfully.');
        this.isFallback = false;
      });

      // Try background connection
      connection.connect().catch((err) => {
        // Suppress initial connection crash, it will trigger the error event handler
      });

      this.queue = new Queue('default', { connection });

      // Start the BullMQ Worker only if connection is active
      const worker = new Worker('default', async (job) => {
        console.log(`[Queue Worker] Processing job #${job.id} (${job.name})`);
        try {
          await this.executeJobDirectly(job.name, job.data);
        } catch (error) {
          console.error(`[Queue Worker Error] Failed job #${job.id} (${job.name}):`, error);
          throw error;
        }
      }, { connection });

      worker.on('completed', (job) => {
        console.log(`[Queue Worker] Job #${job.id} completed successfully`);
      });

      worker.on('failed', (job, err) => {
        console.error(`[Queue Worker] Job #${job?.id} failed:`, err.message);
      });

      // Schedule periodic background job
      this.queue.add('sync-orders', {}, {
        repeat: { every: 60000 },
        jobId: 'periodic-order-sync'
      } as any).catch((err) => {
        console.warn('[Queue] Failed to schedule periodic background sync:', err.message);
      });
    } catch (e: any) {
      console.warn('[Queue] Failed to initialize BullMQ queue. Using direct execution fallback.', e.message);
      this.isFallback = true;
    }

    // Set up local interval for periodic task if fallback is active
    setInterval(() => {
      if (this.isFallback) {
        console.log('[Queue Fallback] Running automated background order sync job...');
        handleSyncOrdersJob().catch((err) => {
          console.error('[Queue Fallback Error] Failed automated background order sync:', err.message);
        });
      }
    }, 60000);
  }

  private async executeJobDirectly(name: string, data: any) {
    if (name === 'send-otp') {
      const { email, code } = data;
      await handleSendOtpJob(email, code);
    } else if (name === 'send-order-confirmation') {
      const { email, orderNumber, total } = data;
      await handleSendOrderConfirmationJob(email, orderNumber, total);
    } else if (name === 'sync-orders') {
      await handleSyncOrdersJob();
    }
  }

  async add(name: string, data: any, opts?: any) {
    if (this.isFallback || !this.queue) {
      console.log(`[Queue Fallback] Executing job "${name}" directly in-memory...`);
      // Execute directly
      try {
        await this.executeJobDirectly(name, data);
      } catch (err: any) {
        console.error(`[Queue Fallback Error] Job "${name}" execution failed:`, err.message);
      }
      return { id: 'fallback-' + Date.now() };
    }

    try {
      return await this.queue.add(name, data, opts);
    } catch (err: any) {
      console.warn(`[Queue] Failed to enqueue job "${name}" to Redis. Executing directly.`, err.message);
      try {
        await this.executeJobDirectly(name, data);
      } catch (e: any) {
        console.error(`[Queue Fallback Error] Job "${name}" execution failed:`, e.message);
      }
      return { id: 'fallback-' + Date.now() };
    }
  }
}

const globalForQueue = global as typeof globalThis & {
  emailQueue?: SafeQueue;
};

export const emailQueue = globalForQueue.emailQueue || new SafeQueue();

if (process.env.NODE_ENV !== 'production') {
  globalForQueue.emailQueue = emailQueue;
}

export default emailQueue;
