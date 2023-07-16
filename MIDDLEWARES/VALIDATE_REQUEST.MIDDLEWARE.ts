import dayjs from "dayjs";
import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError, z } from "zod";
import { ResponseSchema } from "../SCHEMAS/ResponseSchema.schema";
import NITRO_RESPONSE from "../HELPERS/RESPONSE.HELPER";
import { ResponseMapping } from "../UTILS/RESPONSE_MAPPING.UTILS";
import { UTILS } from "../UTILS/INDEX.UTILS";

const ValidateNITRORequest =
  (schema: AnyZodObject) =>
  (
    Request: Request,
    Response: Response<ResponseSchema>,
    next: NextFunction
  ) => {
    try {
      schema.parse({
        body: Request.body,
        query: Request.query,
        params: Request.params,
      });

      next();
    } catch (e: any) {
      UTILS.Logger.warn(e.issues);

      if (e instanceof ZodError) {
        // Handle validation error
        return NITRO_RESPONSE(Response, {
          results: 0,
          data: process.env.NODE_ENV === "development" ? e.issues : null,
          status:
            ResponseMapping.INVALID_REQUEST.MESSAGE ??
            "Missing or Invalid parameters",
          statusCode: ResponseMapping.INVALID_REQUEST.SERVER,
        });
      }
      // else {
      //     // Handle other errors
      //     res.status(500).json({ message: 'Internal Server Error' });
      // }

      return NITRO_RESPONSE(Response, {
        results: 0,
        data: null,
        status: e.errors[0].message,
        statusCode: ResponseMapping.INVALID_REQUEST.SERVER,
      });
    }
  };

export default ValidateNITRORequest;
