import redis from "redis";

export const RedisClient = redis.createClient({
  url: "redis://127.0.0.1:6500",
});

// export const RedisClient2 = redis.createClient();
// RedisClient.s

// export const RedisSET = promisify(client.set).bind(client)
// export const RedisGET = promisify(client.get).bind(client)
