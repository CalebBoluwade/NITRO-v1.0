import { DatabaseError, Pool, QueryResult } from "pg";
import NITRO_RESPONSE from "../../HELPERS/RESPONSE.HELPER";
import { NextFunction, Request, Response } from "express";
import { ResponseSchema } from "../../SCHEMAS/ResponseSchema.schema";
import {
  OneTapMerchantCreateRequest,
  OneTapPaymentRequest,
} from "./ONETAP.SCHEMA";
import crpyto from "crypto";
import { UTILS } from "../../UTILS/INDEX.UTILS";
import { ResponseMapping } from "../../UTILS/RESPONSE_MAPPING.UTILS";
import { FetchUserAccountBalance } from "../ACCOUNTS/ACCOUNT.SERVICE";
import { RedisClientType } from "@redis/client";

// OTC - ONE TAP CARD
export const LinkCustomerOTC_ = (
  Request: Request<{}, {}, OneTapPaymentRequest>,
  Response: Response<ResponseSchema>
) => {};

export const RegisterOTC_Merchant = async (
  Request: Request<{}, {}, OneTapMerchantCreateRequest>,
  Response: Response<ResponseSchema>
) => {
  const DatabaseClient: Pool = (Request as any).DatabaseClient;
  const User = (Request as any).User;
  const {
    merchant_name,
    email,
    password,
    phonenumber,
    merchant_nuban,
    merchant_bankcode,
    merchant_deviceid,
  } = Request.body;

  try {
    const NewMerchant = await DatabaseClient.query(
      "INSERT INTO NITRO_MERCHANTS (USERID, MERCHANT_NAME, EMAIL, PHONENUMBER, PASSWORD, MERCHANT_NUBAN, MERCHANT_BANKCODE, MERCHANT_DEVICEID) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        User.userID,
        // UTILS.GetUUID(),
        merchant_name,
        email,
        phonenumber,
        UTILS.Encrypt(password),
        merchant_nuban,
        merchant_bankcode,
        merchant_deviceid,
      ]
    );

    UTILS.Logger.info(`PROFILE SUCCESSFULLY CREATED FOR ${merchant_name}`);
    return NITRO_RESPONSE(Response, {
      statusCode: ResponseMapping.SUCCESSFULLY_CREATED.SERVER,
      status: ResponseMapping.SUCCESSFULLY_CREATED.MESSAGE,
      results: NewMerchant.rowCount,
      data:
        process.env.NODE_ENV === "development"
          ? NewMerchant.rows
          : UTILS.Encrypt(NewMerchant.rows),
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

// MIDDLEWARE
export const ValidateOTCMerchant = async (
  Request: Request<{}, {}, OneTapPaymentRequest>,
  Response: Response<ResponseSchema>,
  Next: NextFunction
) => {
  const DatabaseClient: Pool = (Request as any).DatabaseClient;
  const User = (Request as any).User;
  const RedisClient: RedisClientType = (Request as any).RedisClient;

  let MERCHANT = await RedisClient.get(`merchant-${User.merchant_name}`);
  MERCHANT = JSON.parse(String(MERCHANT));

  if (MERCHANT !== null || undefined) {
    (Request as any).Merchant = MERCHANT;
    UTILS.Logger.info("Retrieving Merchants from Redis Client");
    Next();
  }

  // console.log(MERCHANT, !!MERCHANT, typeof MERCHANT);

  if (MERCHANT === null || undefined) {
    UTILS.Logger.info("Retrieving Merchants from DB");
    console.log("Retrieving Merchants from DB");
    const DB_MERCHANT = await DatabaseClient.query(
      "SELECT USERID, MERCHANT_NAME, MERCHANT_NUBAN, MERCHANT_BANKCODE, MERCHANT_STATUS FROM NITRO_MERCHANTS WHERE USERID = $1;",
      [User.userID]
    );

    if (!DB_MERCHANT.rowCount) {
      return NITRO_RESPONSE(Response, {
        status: "INVALID MERCHANT",
        statusCode: 400,
        results: 0,
        data: null,
      });
    }

    (Request as any).Merchant = DB_MERCHANT.rows[0];
    RedisClient.set(
      `merchant-${DB_MERCHANT.rows[0].merchant_name}`,
      JSON.stringify(DB_MERCHANT.rows[0])
    );

    // RedisClient.pub

    Next();
  }
};

export const ONETAP_PAYMENT = async (
  Request: Request<{}, {}, OneTapPaymentRequest>,
  Response: Response<ResponseSchema>
) => {
  const {
    AuthPIN,
    Narration,
    CardIdentifier,
    Amount,
    RequestID,
    Source,
    TransactionLocation,
  } = Request.body;
  const DatabaseClient: Pool = (Request as any).DatabaseClient;
  //   const User: { userID: string; payload: any } = (Request as any).User;
  const Merchant = (Request as any).Merchant;

  try {
    const USER: QueryResult<{
      CardIdentifier: string;
      userid: string;
      customer_name: string;
      acctnumber: string;
      tpin: string;
      tlimit: string;
      dlimit: string;
      d_ulimit: string;
    }> = await DatabaseClient.query(
      "SELECT CardIdentifier, CUSTOMER_NAME, USERID, ACCTNUMBER, TPIN, TLIMIT, DLIMIT, D_ULIMIT FROM NITRO_USERS WHERE CardIdentifier = $1;",
      [CardIdentifier]
    );

    if (!USER.rowCount) {
      UTILS.Logger.warn("USER NOT FOUND / INVALID CARD");
      return NITRO_RESPONSE(Response, {
        status:
          ResponseMapping.INVALID_TRANSFER.MESSAGE +
          ": " +
          "USER NOT FOUND / INVALID CARD",
        statusCode: ResponseMapping.INVALID_TRANSFER.SERVER,
        results: USER.rowCount,
        data: null,
      });
    }

    // VALIDATE TRANSACTION PIN
    if (AuthPIN !== UTILS.Decrypt(USER.rows[0].tpin)) {
      UTILS.Logger.warn("TRANSACTION TERMINATED DUE TO INCORRECT PIN");
      const FailedAttempt = await DatabaseClient.query(
        "UPDATE NITRO_USERS SET PINCOUNT = PINCOUNT + 1, STATUS = CASE WHEN PINCOUNT > $2 THEN 'DISABLED' ELSE 'ACTIVE' END WHERE USERID = $1",
        [USER.rows[0].userid, process.env.MAX_LOGIN_ATTEMPTS]
      );

      return NITRO_RESPONSE(Response, {
        status: ResponseMapping.INCORRECT_TPIN.MESSAGE,
        statusCode: ResponseMapping.INCORRECT_TPIN.SERVER,
        results: FailedAttempt.rowCount,
        data:
          process.env.NODE_ENV === "development"
            ? FailedAttempt.rows
            : UTILS.Encrypt(FailedAttempt.rows),
      });
    }

    // MAKE CALL TO FETCH ACCOUNT BALANCE
    const accountData = (await FetchUserAccountBalance(USER.rows[0].acctnumber))
      .data;

    if (!accountData) {
      return NITRO_RESPONSE(Response, {
        status: ResponseMapping.SERVER_ERROR.MESSAGE,
        statusCode: 504,
        results: 0,
        data: null,
      });
    }

    if (accountData.acctStatus !== "Active") {
      return NITRO_RESPONSE(Response, {
        status: "Debit Failed",
        statusCode: 401,
        results: 0,
        data: null,
      });
    }

    // ACCOUNT BALANCE CHECK
    if (Amount > accountData.acctBal) {
      const NEW_TRANSACTION = await DatabaseClient.query(
        "INSERT INTO NITRO_USER_TRANSACTIONS (RequestID, USERID, T_TYPE, ONETAPMERCHANTID, CUSTOMER_NAME, CRACCOUNTNO, DRACCOUNTNO, NARRACTION, AMOUNT, BANKCODE, REFERENCE_ID, STATUS, STATUSCODE, SOURCE, TransactionLocation) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *",
        [
          UTILS.GetUUID(),
          USER.rows[0].userid,
          "ONETAPCARD",
          Merchant.userid,
          USER.rows[0].customer_name,
          Merchant.merchant_nuban,
          USER.rows[0].acctnumber,
          Narration,
          Amount,
          Merchant.merchant_bankcode,
          null,
          ResponseMapping.INSUFFICIENT_FUNDS.MESSAGE,
          ResponseMapping.INSUFFICIENT_FUNDS.CODE,
          Source,
          JSON.stringify(TransactionLocation) ?? null,
        ]
      );

      UTILS.Logger.warn("TRANSACTION TERMINATED DUE TO INSUFFICIENT FUNDS");

      return NITRO_RESPONSE(Response, {
        status: ResponseMapping.INSUFFICIENT_FUNDS.MESSAGE,
        statusCode: ResponseMapping.INSUFFICIENT_FUNDS.SERVER,
        results: NEW_TRANSACTION.rowCount,
        data:
          process.env.NODE_ENV === "development"
            ? NEW_TRANSACTION.rows
            : UTILS.Encrypt(NEW_TRANSACTION.rows),
      });
    }

    // SINGLE LIMIT CHECK
    if (Amount > Number(USER.rows[0].tlimit)) {
      UTILS.Logger.warn("TRANSACTION TERMINATED DUE TO LIMIT");
      return NITRO_RESPONSE(Response, {
        statusCode: ResponseMapping.INVALID_REQUEST.SERVER,
        status: "AMOUNT EXCEED LIMIT",
        results: 0,
        data: null,
      });
    }

    // DAILY LIMIT CHECK
    if (Number(USER.rows[0].d_ulimit) + Amount > Number(USER.rows[0].dlimit)) {
      UTILS.Logger.warn("TRANSACTION TERMINATED DUE TO DAILY LIMIT");
      return NITRO_RESPONSE(Response, {
        statusCode: ResponseMapping.INVALID_REQUEST.SERVER,
        status: "AMOUNT EXCEED DAILY LIMIT",
        results: 0,
        data: null,
      });
    }

    if (USER.rows[0].acctnumber === null) {
      return NITRO_RESPONSE(Response, {
        statusCode: 400,
        status: "INCOMPLETE PROFILE",
        results: 0,
        data: null,
      });
    }

    // SUCCESSFUL TRANSACTION
    if (
      crpyto.timingSafeEqual(
        Buffer.from(AuthPIN),
        Buffer.from(UTILS.Decrypt(USER.rows[0].tpin))
      )
    ) {
      // MAKE CALL TO PERFORM TRANSACTION

      // IF TRANSACTION TIME GREATER THAN SET TIME OUT, SET TO PENDING AND DROP
      const NEW_TRANSACTION = await DatabaseClient.query(
        "INSERT INTO NITRO_USER_TRANSACTIONS (RequestID, USERID, T_TYPE, ONETAPMERCHANTID, CUSTOMER_NAME, CRACCOUNTNO, DRACCOUNTNO, NARRACTION, AMOUNT, BANKCODE, REFERENCE_ID, STATUS, STATUSCODE, SOURCE, TransactionLocation) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *",
        [
          UTILS.GetUUID(),
          USER.rows[0].userid,
          "ONETAPCARD",
          Merchant.userid,
          USER.rows[0].customer_name,
          Merchant.merchant_nuban,
          USER.rows[0].acctnumber,
          Narration,
          Amount,
          Merchant.merchant_bankcode,
          UTILS.GenerateFTRef(),
          ResponseMapping.SUCCESSFUL.MESSAGE,
          ResponseMapping.SUCCESSFUL.CODE,
          Source,
          JSON.stringify(TransactionLocation) ?? null,
        ]
      );

      DatabaseClient.query(
        "UPDATE NITRO_USERS SET PINCOUNT = 0, D_ULIMIT = $2 WHERE USERID = $1;",
        [USER.rows[0].userid, `${Number(USER.rows[0].d_ulimit) + Amount}`]
      );

      DatabaseClient.query(
        "UPDATE NITRO_MERCHANTS SET DAILYSUCCESSCOUNT = DAILYSUCCESSCOUNT + 1, LASTTRANSACTIONDATE = CURRENT_TIMESTAMP WHERE USERID = $1",
        [Merchant.userid]
      );

      UTILS.Logger.info("OTC SUCCESSFUL");

      return NITRO_RESPONSE(Response, {
        status: ResponseMapping.SUCCESSFUL.MESSAGE,
        statusCode: ResponseMapping.SUCCESSFUL.SERVER,
        results: NEW_TRANSACTION.rowCount,
        data:
          process.env.NODE_ENV === "development"
            ? NEW_TRANSACTION.rows
            : UTILS.Encrypt(NEW_TRANSACTION.rows),
      });
    }
  } catch (error: DatabaseError | Error | any) {
    UTILS.Logger.error([error], error.message);

    if (error.code === "23505") {
      UTILS.Logger.error(error.detail);
      return NITRO_RESPONSE(Response, {
        statusCode: ResponseMapping.DUPLICATE_REQUEST.SERVER,
        status: ResponseMapping.DUPLICATE_REQUEST.MESSAGE,
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
