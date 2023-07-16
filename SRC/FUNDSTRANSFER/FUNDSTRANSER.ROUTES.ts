import { Router } from "express";
import INTERFT, { NAMEENQUIRY } from "./INTERFT.SERVICE";
import ValidateNITRORequest from "../../MIDDLEWARES/VALIDATE_REQUEST.MIDDLEWARE";
import { FTSchema, NERequestSchema } from "./INTERFT.SCHEMA";

const FundsTransferRouter = (Router: Router, ValidateAPIUser: any) => {
  Router.get(
    "/FT/NE/:bankCode/:accountNumber",
    ValidateAPIUser,
    ValidateNITRORequest(NERequestSchema),
    NAMEENQUIRY
  );

  /**
   * @swagger
   * /USER/CREATE:
   *   post:
   *     summary: Create a new user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/createUserSchema'
   *     responses:
   *       200:
            description: OK
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/createUserSchema'
   */
  Router.post(
    "/FT/INTER",
    ValidateAPIUser,
    ValidateNITRORequest(FTSchema),
    INTERFT
  );
};

export default FundsTransferRouter;
