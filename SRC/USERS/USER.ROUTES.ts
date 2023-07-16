import { Router } from "express";
import { CreateNewUser, SendPwdReset, UserLoginEmail } from "./USER.SERVICE";
import ValidateNITRORequest from "../../MIDDLEWARES/VALIDATE_REQUEST.MIDDLEWARE";
import {
  PasswordCallBackResetSchema,
  PasswordResetSchema,
  UserEmailAuthSchema,
  createUserSchema,
} from "./USER.SCHEMA";

const userRouter = (Router: Router, ValidateAPIUser: any) => {
  Router.put("/:id");

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
   *         description: OK
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/createUserSchema'
   */
  Router.post(
    "/USER/CREATE",
    ValidateNITRORequest(createUserSchema),
    CreateNewUser
  );

  Router.post(
    "/USER/AUTH/EMAIL",
    ValidateNITRORequest(UserEmailAuthSchema),
    UserLoginEmail
  );

  Router.post(
    "/USER/AUTH/PHONE",
    ValidateNITRORequest(UserEmailAuthSchema),
    UserLoginEmail
  );

  Router.put(
    "/USER/AUTH/RESET/PW",
    ValidateAPIUser,
    ValidateNITRORequest(PasswordResetSchema),
    SendPwdReset
  );

  Router.patch(
    "/USER/AUTH/RESET/PW",
    ValidateNITRORequest(PasswordCallBackResetSchema),
    UserLoginEmail
  );
};

export default userRouter;
