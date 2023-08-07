import { NextFunction, Request, Response } from "express";
import { PGpool } from "../CONFIG/DATABASE.CONFIG";
import { RedisClient } from "../CONFIG/REDIS.CONFIG";

export const DatabaseMiddleware = (
  Request: Request,
  Response: Response,
  next: NextFunction
) => {
  (Request as any).DatabaseClient = PGpool;
  (Request as any).RedisClient = RedisClient; // Request.DatabaseClient = PGpool;
  next();
};
