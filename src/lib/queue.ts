import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { handleSendOtpJob, handleSendOrderConfirmationJob, handleSyncOrdersJob } from './jobs';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Setup connection options for BullMQ (maxRetriesPerRequest must be null for BullMQ)
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const globalForQueue = global as typeof globalThis & {
  emailQueue?: Queue;
  emailWorker?: Worker;
};

// 1. Initialize Queue
export const emailQueue = globalForQueue.emailQueue || new Queue('default', { connection });

if (process.env.NODE_ENV !== 'production') {
  globalForQueue.emailQueue = emailQueue;
}

// 2. Worker setup
if (!globalForQueue.emailWorker) {
  const worker = new Worker('default', async (job) => {
    console.log(`[Queue Worker] Processing job #${job.id} (${job.name})`);
    try {
      if (job.name === 'send-otp') {
        const { email, code } = job.data;
        await handleSendOtpJob(email, code);
      } else if (job.name === 'send-order-confirmation') {
        const { email, orderNumber, total } = job.data;
        await handleSendOrderConfirmationJob(email, orderNumber, total);
      } else if (job.name === 'sync-orders') {
        await handleSyncOrdersJob();
      }
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

  globalForQueue.emailWorker = worker;

  // 3. Schedule Repeatable/Cron job for auto-syncing orders every 60 seconds
  emailQueue.add('sync-orders', {}, {
    repeat: {
      every: 60000 // 60,000 milliseconds = 60 seconds
    },
    jobId: 'periodic-order-sync' // static ID to prevent duplication on restart
  }).then(() => {
    console.log('🗓️ Automated background order sync job scheduled successfully (every 60s).');
  }).catch((err) => {
    console.error('Failed to schedule automated background order sync job:', err);
  });
}
export default emailQueue;
