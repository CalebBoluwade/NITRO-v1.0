import { Router } from "express";
import ValidateNITRORequest from "../../MIDDLEWARES/VALIDATE_REQUEST.MIDDLEWARE";
import { AccountBalanceSchema, CreateAccountSchema } from "./ACCOUNT.SCHEMA";
import {
  CreateUserAccount,
  FetchUserAccountBalance,
  UserAccountBalance,
} from "./ACCOUNT.SERVICE";

const AccountsRouter = (Router: Router, ValidateAPIUser: any) => {
  Router.get(
    "/ACCT/BAL/:accountNumber",
    ValidateAPIUser,
    ValidateNITRORequest(AccountBalanceSchema),
    UserAccountBalance
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
    "/ACCT/NEW",
    ValidateAPIUser,
    ValidateNITRORequest(CreateAccountSchema),
    CreateUserAccount
  );
};

export default AccountsRouter;
