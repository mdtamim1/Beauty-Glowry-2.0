import IORedis from 'ioredis';

class SafeRedis {
  private client: IORedis | null = null;
  private memoryStore = new Map<string, { value: string; expiresAt?: number }>();
  private isFallback = false;

  constructor(url: string) {
    try {
      this.client = new IORedis(url, {
        maxRetriesPerRequest: 1, // Fail fast if down
        connectTimeout: 2000,
        lazyConnect: true // Do not block initialization on connection
      });

      this.client.on('error', (err) => {
        if (!this.isFallback) {
          console.warn('[Redis] Connection failed. Falling back to in-memory store.', err.message);
          this.isFallback = true;
        }
      });

      this.client.on('connect', () => {
        console.log('[Redis] Connected successfully.');
        this.isFallback = false;
      });

      // Try background connection
      this.client.connect().catch((err) => {
        // Suppress initial connection crash, it will trigger the error event handler
      });
    } catch (e: any) {
      console.warn('[Redis] Failed to initialize client. Using in-memory fallback.', e.message);
      this.isFallback = true;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client && !this.isFallback && this.client.status === 'ready') {
      try {
        return await this.client.get(key);
      } catch (err: any) {
        console.warn('[Redis] GET command failed, falling back to memory:', err.message);
      }
    }
    
    // In-memory fallback
    const item = this.memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    if (this.client && !this.isFallback && this.client.status === 'ready') {
      try {
        if (mode === 'EX' && duration !== undefined) {
          return await this.client.set(key, value, 'EX', duration);
        }
        return await this.client.set(key, value);
      } catch (err: any) {
        console.warn('[Redis] SET command failed, falling back to memory:', err.message);
      }
    }

    // In-memory fallback
    const expiresAt = (mode === 'EX' && duration !== undefined) ? Date.now() + duration * 1000 : undefined;
    this.memoryStore.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    if (this.client && !this.isFallback && this.client.status === 'ready') {
      try {
        return await this.client.del(key);
      } catch (err: any) {
        console.warn('[Redis] DEL command failed, falling back to memory:', err.message);
      }
    }

    // In-memory fallback
    const exists = this.memoryStore.has(key);
    this.memoryStore.delete(key);
    return exists ? 1 : 0;
  }
}

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const globalForRedis = global as typeof globalThis & {
  redis?: SafeRedis;
};

export const redis = globalForRedis.redis || new SafeRedis(redisUrl);

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

export default redis;
