import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
import ip from "ip";
import { UTILS } from "../UTILS/INDEX.UTILS";
import { JwtPayload } from "jsonwebtoken";
import NITRO_RESPONSE from "../HELPERS/RESPONSE.HELPER";

interface JWTResponse {
  valid: boolean;
  expired: boolean;
  decoded: string | JwtPayload | null;
}

const ValidateAPIUser =
  (VerifyUser: (token: string, type: "access" | "refresh") => JWTResponse) =>
  (Request: Request, Response: Response, next: NextFunction): void => {
    const start = Date.now();
    try {
      const accessToken = get(Request, "headers.authorization", "").replace(
        /^Bearer\s/,
        ""
      );
      const user = VerifyUser(accessToken, "access");
      // console.log(Request.body)

      const remoteIP = ip.address();

      UTILS.Logger.info(
        {
          ip: remoteIP || Request.ip,
          path: Request.baseUrl + Request.url,
          data:
            Object.keys(Request.body).length !== 0
              ? Request.body
              : Object.keys(Request.query).length !== 0
              ? Request.query
              : Request.params,
        },
        user.valid
          ? "Request Accepted"
          : accessToken
          ? "Request Denied. Expired / Invalid Token"
          : "Request Denied.. No Token Provided"
      );

      if (!user.valid) {
        return NITRO_RESPONSE(Response, {
          data: null,
          results: 0,
          status: accessToken ? "Expired / Invalid Token" : "No Token Provided",
          statusCode: 401,
        });
      }

      if (
        !JSON.parse(process.env.AllowedSources!)?.includes(Request.body?.Source)
      ) {
        return NITRO_RESPONSE(Response, {
          status: "Invalid Source",
          statusCode: 400,
          data: null,
          results: 0,
        });
      }

      if (
        user.valid &&
        JSON.parse(process.env.AllowedSources!)?.includes(Request.body?.Source)
      ) {
        (Request as any).User = user.decoded;
        // UTILS.Logger.info(
        //   Request.baseUrl + Request.url,
        //   "Request Accepted. Endpoint:",
        // );

        Response.on("finish", (...data: any) => {
          // console.log(data);
          const duration = Date.now() - start;

          Response.locals.requestCount = 0;
          Response.locals.errorCount = 0;
          Response.locals.errorRate = 0;

          Response.locals.requestCount++;
          if (Response.statusCode < 400) {
            Response.locals.requestCount++;
          }

          const requestCount = Response.locals.requestCount;
          const errorRate = Response.locals.errorRate;
          Response.locals.request = { duration, requestCount, errorRate };
          // console.log(res.locals);
        });

        // console.log(Response.locals);
        return next();
      }
    } catch (error: any) {
      UTILS.Logger.error([error], error.message);
      return NITRO_RESPONSE(Response, {
        data: null,
        results: 0,
        status: "Unable To Verify",
        statusCode: 400,
      });
    }

    // console.log(accessToken);
    // if (accessToken) {
    //     next();
    // httpCode: error.httpCode;
    // }
  };

export default ValidateAPIUser;
