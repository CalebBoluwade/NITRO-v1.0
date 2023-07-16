import { Response } from "express";
import { ResponseSchema } from "../SCHEMAS/ResponseSchema.schema";
import { UTILS } from "../UTILS/INDEX.UTILS";

const NITRO_RESPONSE = (
  Response: Response<ResponseSchema>,
  ResponseData: ResponseSchema
) => {
  Response.status(ResponseData.statusCode).send(ResponseData);
};

export default NITRO_RESPONSE;
