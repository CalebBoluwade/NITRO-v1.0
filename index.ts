import dotenv from "dotenv";
dotenv.config();
import express, {
  Application,
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import { PGpool } from "./CONFIG/DATABASE.CONFIG";
import compression from "compression";
import responseTime from "response-time";
import cors from "cors";
import ip from "ip";
import helmet from "helmet";
import ApplicationRouter, { Route } from "./ROUTES/INDEX.ROUTES";
import { UTILS } from "./UTILS/INDEX.UTILS";
// import { RedisClient } from "./CONFIG/REDIS.CONFIG";
import rateLimit from "express-rate-limit";
// import slowDown from "express-slow-down";
// import { RedisClient } from "./CONFIG/REDIS.CONFIG";
// import { createClient } from "redis";
import { ResponseSchema } from "./SCHEMAS/ResponseSchema.schema";
import NITRO_RESPONSE from "./HELPERS/RESPONSE.HELPER";

// import amqp from "amqplib";
import { DatabaseMiddleware } from "./MIDDLEWARES/DATABASE.MIDDLEWARE";
import { RedisClient } from "./CONFIG/REDIS.CONFIG";

const queue = "nitro_nip_payments";
const text = {
  item_id: "macbook",
  text: "This is a sample message to send receiver to check the ordered Item Availablility",
};

// export const SendMessageQueue = async (queue: string, message: any) => {
//   //   let connection;
//   const connection = await amqp.connect("amqp://localhost");
//   try {
//     const channel = await connection.createChannel();

//     await channel.assertQueue(queue, { durable: false });
//     channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
//     console.log(" [x] Sent '%s'", message);
//     await channel.close();
//   } catch (err) {
//     console.warn(err);
//   } finally {
//     if (connection) await connection.close();
//   }
// };

export const NITRO_APP: Application = express();
// Rate Limiting

const rateLimiter = rateLimit({
  windowMs: 10 * 60 * 5000,
  max: 35,
  handler: (
    Request: Request,
    Response: Response<ResponseSchema>,
    next: NextFunction
  ) => {
    // next();
    return NITRO_RESPONSE(Response, {
      status: "TOO MANY REQUESTS",
      statusCode: 429,
      results: 0,
      data: null,
    });
  },
});

// const slow = slowDown

NITRO_APP.use(rateLimiter);
NITRO_APP.set("trust proxy", 1);
NITRO_APP.use(express.urlencoded({ extended: true, limit: "50kb" }));
NITRO_APP.use(express.json({ limit: "50kb" }));
NITRO_APP.use(
  compression({
    level: 8,
    threshold: 0,
  })
);
NITRO_APP.use(responseTime());
NITRO_APP.use(DatabaseMiddleware);

NITRO_APP.use(helmet());
NITRO_APP.use(
  helmet.contentSecurityPolicy({
    // the following directives will be merged into the default helmet CSP policy
    directives: {
      defaultSrc: ["'self'"], // default value for all directives that are absent
      scriptSrc: ["'self'"], // helps prevent XSS attacks
      frameAncestors: ["'none'"], // helps prevent Clickjacking attacks
      imgSrc: ["'self'", "'http://imgexample.com'"],
      styleSrc: ["'none'"],
    },
  })
);
NITRO_APP.use(helmet.crossOriginEmbedderPolicy());
NITRO_APP.use(helmet.crossOriginOpenerPolicy());
NITRO_APP.use(helmet.crossOriginResourcePolicy());
NITRO_APP.use(helmet.dnsPrefetchControl());
NITRO_APP.use(helmet.frameguard());
NITRO_APP.use(helmet.hidePoweredBy());
NITRO_APP.use(
  helmet.hsts({
    maxAge: 123456,
    includeSubDomains: false,
  })
);
// NITRO_APP.use(helmet.expectCt());
NITRO_APP.use(helmet.ieNoOpen());
NITRO_APP.use(helmet.noSniff());
NITRO_APP.use(helmet.originAgentCluster());
NITRO_APP.use(helmet.permittedCrossDomainPolicies());
NITRO_APP.use(helmet.referrerPolicy());
NITRO_APP.use(helmet.xssFilter());

RedisClient.on("connect", () => {
  UTILS.Logger.info("Connected to Redis");
});

RedisClient.on("error", (error) => {
  UTILS.Logger.error(error, "Redis error");
  process.exitCode = 1;
});

const StartServer = async () => {
  console.log("ENVIRONMENT >>>", process.env.NODE_ENV);

  try {
    await RedisClient.connect();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }

  // SendMessageQueue(queue, text);

  PGpool.connect((err) => {
    if (err) {
      UTILS.Logger.error(err, "Error connecting to database");
      process.exitCode = 1;
    } else {
      UTILS.Logger.info("Connected to Postgres DB");
    }
  });
};

StartServer();

// RedisClient.set('')
// RedisClient.setEx('myKey', 'myValue', (err: Error | null, result: string | undefined) => {
//   if (err) {
//     console.error(err);
//   } else {
//     console.log('Key saved successfully');
//   }
// });

// const remoteIP = ip.address();

NITRO_APP.use((req: Request, res: Response, next: NextFunction) => {
  const period = 60 * 5;

  if (req.method === "GET") {
    res.set("Cache-control", `public, max-age=${period}`);
  } else {
    res.set("Cache-control", "no-store");
  }
  next();
});

export const ErrorHandler: ErrorRequestHandler = async (
  error,
  Request,
  Response: Response<ResponseSchema>,
  Next
) => {
  try {
    // mail = errorMailer.sendMail({
    //     from: 'contact@neverforgetit.net',
    //     to: 'kuczak.tomasz@gmail.com',
    //     subject: 'REST API Error',
    //     text: 'There has been an error in the bookstore REST API',
    //     html: '<p>There has been an error in the bookstore REST API<p>'
    // })
    UTILS.Logger.error(`Message sent`);
    UTILS.Logger.error(error, error.message);
  } catch (e) {
    UTILS.Logger.error(e);
  }

  return NITRO_RESPONSE(Response, {
    statusCode: 500,
    status: "There was an internal server error. Please try again.",
    results: 0,
    data: null,
  });
  // Response.status(500).send("Internal Server Error");
  // Next();
};
// Define error-handling middleware

NITRO_APP.use("/NITRO/API/V1", Route);
NITRO_APP.use(ErrorHandler);

ApplicationRouter(NITRO_APP);

const NITRO_SERVER = NITRO_APP.listen(5000, () => {
  UTILS.Logger.info("NITRO SUCCESSFULLY STARTED...");
  console.info(`WRITING APPLICATION LOGS to ${__dirname}/LOGS/NITRO.LOG`);
});

// Graceful Shutdown
["SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    console.log(PGpool.totalCount);
    await PGpool.end();
    console.log(PGpool.totalCount);
    // RedisClient.shutdown("SAVE");
    UTILS.Logger.warn("NITRO IS BEEN SHUT DOWN...");
    setTimeout(() => {
      UTILS.Logger.info("NITRO TERMINATED...");
      NITRO_SERVER.close(() => {
        UTILS.Logger.info("NITRO HAS BEEN SHUT DOWN...");
      });

      process.exitCode = 1; // Terminate the application
    }, 5000);
  });
});

["SIGINT"].forEach((signal) => {
  process.on(signal, async () => {
    console.log(PGpool.totalCount);
    await PGpool.end();
    console.log(PGpool.totalCount);
    // RedisClient.shutdown("SAVE");
    UTILS.Logger.warn("NITRO IS BEEN SHUT DOWN...");
    setTimeout(() => {
      UTILS.Logger.info("NITRO TERMINATED...");
      NITRO_SERVER.close(() => {
        UTILS.Logger.info("NITRO HAS BEEN SHUT DOWN...");
      });

      process.exitCode = 1; // Terminate the application
    }, 5000);
  });
});
