import { createClient } from "redis";
import redis from "redis";

export const RedisClient = createClient({
  url: process.env.REDIS_RESOURCE,
});
