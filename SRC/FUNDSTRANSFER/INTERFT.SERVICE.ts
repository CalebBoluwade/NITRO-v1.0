import { Request, Response } from "express";
import { ResponseSchema } from "../../SCHEMAS/ResponseSchema.schema";
import { NE_RESPONSE, NERequest, NewFTRequest } from "./INTERFT.SCHEMA";
import { Pool, DatabaseError } from "pg";
import { UTILS } from "../../UTILS/INDEX.UTILS";
import NITRO_RESPONSE from "../../HELPERS/RESPONSE.HELPER";
import { ResponseMapping } from "../../UTILS/RESPONSE_MAPPING.UTILS";
import { FetchUserAccountBalance } from "../ACCOUNTS/ACCOUNT.SERVICE";
import crpyto from "crypto";

export const NAMEENQUIRY = async (
  Request: Request<NERequest>,
  Response: Response<ResponseSchema>
) => {
  /**
   * @GET
   */
  const { accountNumber, bankCode } = Request.params;
  UTILS.Logger.info({ accountNumber, bankCode }, "NAME ENQUIRY REQUEST");

  try {
    // FETCH NE
    console.log(accountNumber, bankCode);

    return NITRO_RESPONSE(Response, {
      status: ResponseMapping.SUCCESSFUL.MESSAGE,
      statusCode: ResponseMapping.SUCCESSFUL.SERVER,
      results: 0,
      data: process.env.NODE_ENV === "development" ? [] : UTILS.Encrypt([]),
    });
  } catch (error) {
    return NITRO_RESPONSE(Response, {
      statusCode: ResponseMapping.SERVER_ERROR.SERVER,
      status: ResponseMapping.SERVER_ERROR.MESSAGE,
      results: 0,
      data: null,
    });
  }
};

const InternalFT = async () => {};

const ExternalFT = async () => {
  return {
    SessionID: "53789874667839405-876590-9876543",
    status: ResponseMapping.SUCCESSFUL.MESSAGE,
    code: ResponseMapping.SUCCESSFUL.CODE,
  };
};

/**
 * @POST
 */
const INTERFT = async (
  Request: Request<{}, {}, NewFTRequest>,
  Response: Response<ResponseSchema>
) => {
  const DatabaseClient: Pool = (Request as any).DatabaseClient;
  const User = (Request as any).User;
  const {
    Beneficiary,
    CreditAccountNo,
    CreditAccountName,
    CreditInstitutionCode,
    Amount,
    DebitAccountNo,
    Source,
    RequestID,
    Narration,
    AuthPIN,
    TransactionLocation,
  } = Request.body;

  try {
    const USER = await DatabaseClient.query(
      "SELECT ACCTNUMBER, TPIN, TLIMIT, DLIMIT, D_ULIMIT FROM NITRO_USERS WHERE USERID = $1",
      [User.userID]
    );

    if (!USER.rowCount) {
      UTILS.Logger.warn("USER NOT FOUND");
      return NITRO_RESPONSE(Response, {
        status: ResponseMapping.INVALID_TRANSFER.MESSAGE,
        statusCode: ResponseMapping.INVALID_TRANSFER.SERVER,
        results: USER.rowCount,
        data: null,
      });
    }

    if (DebitAccountNo !== USER.rows[0].acctnumber) {
      UTILS.Logger.warn("INVALID SOURCE ACCOUNT");

      return NITRO_RESPONSE(Response, {
        status: ResponseMapping.INVALID_TRANSFER.MESSAGE,
        statusCode: ResponseMapping.INVALID_TRANSFER.SERVER,
        results: 0,
        data: null,
      });
    }

    // VALIDATE TRANSACTION PIN
    if (AuthPIN !== UTILS.Decrypt(USER.rows[0].tpin)) {
      UTILS.Logger.warn("TRANSACTION TERMINATED DUE TO INCORRECT PIN");
      const FailedAttempt = await DatabaseClient.query(
        "UPDATE NITRO_USERS SET PINCOUNT = PINCOUNT + 1, STATUS = CASE WHEN PINCOUNT > $2 THEN 'DISABLED' ELSE 'ACTIVE' END WHERE USERID = $1",
        [User.userID, process.env.MAX_LOGIN_ATTEMPTS]
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

    // ACCOUNT BALANCE CHECK
    if (Amount > accountData!.acctBal) {
      const NEW_TRANSACTION = await DatabaseClient.query(
        "INSERT INTO NITRO_USER_TRANSACTIONS (RequestID, USERID, T_TYPE, CUSTOMER_NAME, CRACCOUNTNO, DRACCOUNTNO, NARRACTION, AMOUNT, BANKCODE, REFERENCE_ID, SESSION_ID, STATUS, STATUSCODE, SOURCE, TransactionLocation) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *",
        [
          UTILS.GetUUID(),
          User.userID,
          "NITRO_FT",
          CreditAccountName,
          CreditAccountNo,
          DebitAccountNo,
          Narration,
          Amount,
          CreditInstitutionCode,
          null,
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

    // SUCCESSFUL TRANSACTION
    if (
      crpyto.timingSafeEqual(
        Buffer.from(AuthPIN),
        Buffer.from(UTILS.Decrypt(USER.rows[0].tpin))
      )
    ) {
      // MAKE CALL TO PERFORM TRANSACTION
      const ExFT = await ExternalFT();
      // IF TRANSACTION TIME GREATER THAN SET TIME OUT, SET TO PENDING AND DROP
      const NEW_TRANSACTION = await DatabaseClient.query(
        "INSERT INTO NITRO_USER_TRANSACTIONS (RequestID, USERID, T_TYPE, CUSTOMER_NAME, CRACCOUNTNO, DRACCOUNTNO, NARRACTION, AMOUNT, BANKCODE, REFERENCE_ID, SESSION_ID, STATUS, STATUSCODE, SOURCE, TransactionLocation) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *",
        [
          RequestID,
          User.userID,
          "INTER_FT",
          CreditAccountName,
          CreditAccountNo,
          DebitAccountNo,
          Narration,
          Amount,
          CreditInstitutionCode,
          UTILS.GenerateFTRef(),
          ExFT.SessionID,
          ExFT.status,
          ExFT.code,
          Source,
          JSON.stringify(TransactionLocation) ?? null,
        ]
      );

      await DatabaseClient.query(
        "UPDATE NITRO_USERS SET PINCOUNT = 0, D_ULIMIT = $2 WHERE USERID = $1",
        [User.userID, `${Number(USER.rows[0].d_ulimit) + Amount}`]
      );

      UTILS.Logger.info(
        `${Amount} FROM ${DebitAccountNo} TRANSFERRED SUCCESSFULLY TO ${CreditAccountNo}`
      );

      if (Beneficiary) {
        UTILS.Logger.info("SAVING BENEFICIARY");
        DatabaseClient.query(
          "INSERT INTO NITRO_USER_BENEFICIARIES (USERID, CUSTOMER_NAME, CRACCOUNTNO, BANKCODE) VALUES($1, $2, $3, $4) RETURNING *",
          [
            User.userID,
            CreditAccountName,
            CreditAccountNo,
            CreditInstitutionCode,
          ],
          () => {
            UTILS.Logger.warn("BENEFICIARY ALREADY EXIST");
          }
        );
      }

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

export default INTERFT;
