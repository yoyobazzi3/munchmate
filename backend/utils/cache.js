import redis from '../config/redis.js';

export const getCache = async (key) => {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
};

export const setCache = async (key, value, ttlSeconds) => {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // non-fatal — cache miss on next request is fine
  }
};
