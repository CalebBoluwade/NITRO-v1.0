import { Pool, QueryResult } from "pg";
import NITRO_RESPONSE from "../../HELPERS/RESPONSE.HELPER";
import { ResponseMapping } from "../../UTILS/RESPONSE_MAPPING.UTILS";
import { Request, Response } from "express";
import { ResponseSchema } from "../../SCHEMAS/ResponseSchema.schema";
import {
  CreateUserRequest,
  EmailAuthRequest,
  PasswordResetRequest,
} from "./USER.SCHEMA";
import { UTILS } from "../../UTILS/INDEX.UTILS";
import crpyto from "crypto";

export const CreateNewUser = async (
  Request: Request<{}, {}, CreateUserRequest>,
  Response: Response<ResponseSchema>
) => {
  // console.log("S",Request.body)
  try {
    const {
      email,
      customer_name,
      phonenumber,
      device,
      appverion,
      userpushid,
      password,
      tpin,
      ipaddress,
    } = Request.body;
    const DatabaseClient: Pool = (Request as any).DatabaseClient;

    const NEW_USER: QueryResult<CreateUserRequest> = await DatabaseClient.query(
      "INSERT INTO NITRO_USERS (CUSTOMER_NAME, USERID, email, PHONENUMBER, DEVICE, APPVERSION, USERPUSHID, PASSWORD, TPIN, IP) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
      [
        customer_name,
        UTILS.GetUUID(),
        email,
        phonenumber,
        device,
        appverion,
        userpushid,
        UTILS.Encrypt(password),
        UTILS.Encrypt(tpin),
        ipaddress,
      ]
    );

    UTILS.Logger.info(`PROFILE SUCCESSFULLY CREATED FOR ${customer_name}`);
    return NITRO_RESPONSE(Response, {
      statusCode: ResponseMapping.SUCCESSFULLY_CREATED.SERVER,
      status: ResponseMapping.SUCCESSFULLY_CREATED.MESSAGE,
      results: NEW_USER.rowCount,
      data: UTILS.Encrypt(NEW_USER.rows),
    });
  } catch (error: any) {
    UTILS.Logger.error([error], error.message);

    if (error.code === "23505") {
      UTILS.Logger.error(error.detail);
      return NITRO_RESPONSE(Response, {
        statusCode: ResponseMapping.INVALID_REQUEST_USER.SERVER,
        status: ResponseMapping.INVALID_REQUEST_USER.MESSAGE,
        results: 0,
        data: null,
      });
    }

    if (error.code !== "23505") {
      return NITRO_RESPONSE(Response, {
        statusCode: ResponseMapping.SERVER_ERROR.SERVER,
        status: ResponseMapping.SERVER_ERROR.MESSAGE,
        results: 0,
        data: null,
      });
    }
  }
};

export const UserLoginEmail = async (
  Request: Request<{}, {}, EmailAuthRequest>,
  Response: Response
) => {
  try {
    const DatabaseClient: Pool = (Request as any).DatabaseClient;
    const { email, password, ipaddress, appverion, device } = Request.body;

    const USER: QueryResult<CreateUserRequest> = await DatabaseClient.query(
      "SELECT CUSTOMER_NAME, EMAIL, PASSWORD, USERID, STATUS, PHONENUMBER, USERPUSHID, DEVICE, APPVERSION FROM NITRO_USERS WHERE EMAIL = $1",
      [email]
    );

    if (USER.rowCount === 0) {
      return NITRO_RESPONSE(Response, {
        statusCode: ResponseMapping.INCORRECT_LOGIN_EMAIL.SERVER,
        status: ResponseMapping.INCORRECT_LOGIN_EMAIL.MESSAGE,
        results: USER.rowCount,
        data: null,
      });
    }

    if (USER.rows[0]?.status !== "ACTIVE") {
      UTILS.Logger.warn(`PROFILE LOCKED. ${USER.rows[0].customer_name}`);
      return NITRO_RESPONSE(Response, {
        statusCode: ResponseMapping.ACCT_LOCKED.SERVER,
        status: ResponseMapping.ACCT_LOCKED.MESSAGE,
        results: 0,
        data: null,
      });
    }
    // let decryptedPWD = new TextEncoder().encode(
    //   UTILS.Decrypt(USER.rows[0]?.password)
    // );
    // let decryptedPWD = String(UTILS.Decrypt(USER.rows[0]?.password))
    if (UTILS.Decrypt(USER.rows[0]?.password) !== password) {
      UTILS.Logger.warn(`INCORRECT PASSWORD. ${USER.rows[0].customer_name}`);
      const FailedAttempt = await DatabaseClient.query(
        "UPDATE NITRO_USERS SET LOGINCOUNT = LOGINCOUNT + 1, IP = $3, STATUS = CASE WHEN LOGINCOUNT > $2 THEN 'DISABLED' ELSE 'ACTIVE' END WHERE USERID = $1",
        [USER.rows[0]?.userid, process.env.MAX_LOGIN_ATTEMPTS, ipaddress]
      );

      return NITRO_RESPONSE(Response, {
        statusCode: ResponseMapping.INCORRECT_LOGIN_EMAIL.SERVER,
        status: ResponseMapping.INCORRECT_LOGIN_EMAIL.MESSAGE,
        results: FailedAttempt.rowCount,
        data:
          process.env.NODE_ENV === "development"
            ? FailedAttempt.rows
            : UTILS.Encrypt(FailedAttempt.rows),
      });
    }

    if (
      crpyto.timingSafeEqual(
        Buffer.from(UTILS.Decrypt(USER.rows[0]?.password)),
        Buffer.from(password)
      )
    ) {
      UTILS.Logger.info(`LOGIN SUCCESSFUL. ${USER.rows[0].customer_name}`);
      await DatabaseClient.query(
        "UPDATE NITRO_USERS SET LOGINCOUNT = 0, IP = $2, LASTLOGIN = CURRENT_TIMESTAMP WHERE USERID = $1",
        [USER.rows[0]?.userid, ipaddress]
      );

      const Token = UTILS.signJWT(USER.rows[0].userid!, {
        device: USER.rows[0].device,
        pushid: USER.rows[0].userpushid,
      });

      return NITRO_RESPONSE(Response, {
        statusCode: ResponseMapping.SUCCESSFUL.SERVER,
        status: ResponseMapping.SUCCESSFUL.MESSAGE,
        results: USER.rowCount,
        data:
          process.env.NODE_ENV === "development"
            ? [{ ...USER.rows[0], token: Token }]
            : UTILS.Encrypt([{ ...USER.rows[0], token: Token }]),
      });
    }
  } catch (error: any) {
    UTILS.Logger.error([error], error.message);

    console.error(error);
    return NITRO_RESPONSE(Response, {
      statusCode: ResponseMapping.SERVER_ERROR.SERVER,
      status: ResponseMapping.SERVER_ERROR.MESSAGE,
      results: 0,
      data:
        process.env.NODE_ENV === "development" ? JSON.stringify([error]) : null,
    });
  }
};

export const UpdateUserEmailByID = async (
  DatabaseClient: Pool,
  Request: any,
  res: any
) => {
  const { ID } = Request.params;
  const { Email } = Request.body;
  try {
    const USER = await DatabaseClient.query(
      "UPDATE NITRO_USERS SET Email = $1 WHERE ID = $2",
      [Email, ID]
    );

    console.log(USER.rows);
  } catch (error) {}
};

export const SendPwdReset = async (
  Request: Request<{}, {}, PasswordResetRequest>,
  Response: Response
) => {
  try {
    const DatabaseClient: Pool = (Request as any).DatabaseClient;
    const User = (Request as any).User;
    const { email, phonenumber } = Request.body;

    const USER: QueryResult<{ email: string; phonenumber: string }> =
      await DatabaseClient.query(
        "SELECT EMAIL, PHONENUMBER FROM NITRO_USERS WHERE USERID = $1",
        [User.userID]
      );

    if (
      email === USER.rows[0].email ||
      phonenumber === USER.rows[0].phonenumber
    ) {
      const OTP = UTILS.GenerateOTP();
      const EncryptedOTP = UTILS.Encrypt(JSON.stringify(OTP));

      const resetPwdUrl = `${process.env.HOST}pwdReset?token=${User.userID}`;

      await DatabaseClient.query(
        "UPDATE NITRO_USERS SET TOKEN = $2 WHERE USERID = $1",
        [User.userID, EncryptedOTP]
      );

      return NITRO_RESPONSE(Response, {
        statusCode: ResponseMapping.SUCCESSFUL.SERVER,
        status: "SENT OUT SUCCESSFULLY",
        results: 0,
        data: null,
      });
    }

    return NITRO_RESPONSE(Response, {
      statusCode: 304,
      status: "MISMATCH",
      results: 0,
      data: null,
    });
  } catch (error: any) {
    UTILS.Logger.error([error], error.message);

    return NITRO_RESPONSE(Response, {
      statusCode: ResponseMapping.SERVER_ERROR.SERVER,
      status: ResponseMapping.SERVER_ERROR.MESSAGE,
      results: 0,
      data: null,
    });
  }

  // Email Service
  // ES(email, otp, resetPwdUrl)
};

export const PwdReset = async (
  Request: Request<{ id: string }, {}, { email: string }>,
  Response: Response
) => {
  const DatabaseClient: Pool = (Request as any).DatabaseClient;
  const User = (Request as any).User;
  const { id } = Request.query;
  const { email } = Request.body;

  const OTP = UTILS.GenerateOTP();
  const resetToken = UTILS.GetUUID();

  const resetPwdUrl = `${process.env.HOST}/pwdReset?token=${resetToken}&id=${User.id}`;

  // Email Service
  // ES(email, otp, resetPwdUrl)
};
