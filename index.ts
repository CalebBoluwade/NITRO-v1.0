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
import { createClient } from "redis";
import { ResponseSchema } from "./SCHEMAS/ResponseSchema.schema";
import NITRO_RESPONSE from "./HELPERS/RESPONSE.HELPER";

export const NITRO_APP: Application = express();
// Rate Limiting
const limiter = rateLimit({
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

NITRO_APP.use(limiter);
NITRO_APP.set("trust proxy", 1);

// NITRO_APP.use((req: Request, res: Response, next: NextFunction) => {
//   const error: any = new Error("Not Found");
//   error.status = 404;

//   next({
//     status: "INVALID ROUTE",
//     statusCode: 404,
//     results: 0,
//     data: null,
//   });
// });

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

export const RedisClient = createClient({
  url: "redis://127.0.0.1:6500",
});

RedisClient.on("connect", () => {
  UTILS.Logger.info("Connected to Redis");
});

RedisClient.on("error", (error) => {
  UTILS.Logger.error(error, "Redis error");
});

const StartServer = async () => {
  await RedisClient.connect();

  PGpool.connect((err) => {
    if (err) {
      UTILS.Logger.error(err, "Error connecting to database");
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

const DatabaseMiddleware = (
  Request: Request,
  Response: Response,
  next: NextFunction
) => {
  (Request as any).DatabaseClient = PGpool;
  // (Request as any).RedisClient = RedisClient;
  // Request.DatabaseClient = PGpool;
  next();
};

NITRO_APP.use(express.urlencoded({ extended: true, limit: "50kb" }));
NITRO_APP.use(express.json({ limit: "50kb" }));
NITRO_APP.use(
  compression({
    level: 6,
    threshold: 0,
  })
);
NITRO_APP.use(responseTime());
NITRO_APP.use(DatabaseMiddleware);
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
  Response,
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

  // Response.status(500).send("Internal Server Error");
  Response.status(500).send({
    message: "There was an internal server error. Please try again.",
  });
  // Next();
};
// Define error-handling middleware

NITRO_APP.use(ErrorHandler);
NITRO_APP.use("/NITRO/API/V1", Route);

ApplicationRouter(NITRO_APP);

const NITRO_SERVER = NITRO_APP.listen(5000, () => {
  UTILS.Logger.info("NITRO SUCCESSFULLY STARTED...");
  console.info(`WRITING APPLICATION LOGS to ${__dirname}/LOGS/NITRO.LOG`);
});

// Graceful Shutdown
["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    await PGpool.end();
    UTILS.Logger.info("NITRO IS BEEN SHUT DOWN...");
    setTimeout(() => {
      UTILS.Logger.info("NITRO TERMINATED...");
      NITRO_SERVER.close(() => {
        UTILS.Logger.info("NITRO HAS BEEN SHUT DOWN...");
      });
      process.exit(0); // Terminate the application
    }, 1000);
    // RedisClient.shutdown("SAVE");
    // console.warn("Server is gracefully shutting down...");

    // NITRO_APP.close(async () => {
    // })
  });
});
