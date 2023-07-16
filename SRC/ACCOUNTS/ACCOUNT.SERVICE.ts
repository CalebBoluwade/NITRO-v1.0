import needle from "needle";
import { PoolClient } from "pg";
import { ResponseSchema } from "../../SCHEMAS/ResponseSchema.schema";
import { Request, Response } from "express";
import { AccountBalRequest, NewAccountRequest } from "./ACCOUNT.SCHEMA";
import NITRO_RESPONSE from "../../HELPERS/RESPONSE.HELPER";
import { ResponseMapping } from "../../UTILS/RESPONSE_MAPPING.UTILS";
import { UTILS } from "../../UTILS/INDEX.UTILS";

export const FetchUserAccountBalance = async () => {
  const params = new URLSearchParams({
    ["key"]: "value",
  });

  // const accountData = await needle('get', `${BASE_URL}?${params}`)
  const UserAccountInfo = await Promise.resolve({
    id: "11111111",
    acctBal: 50000,
    acctStatus: "active",
  });

  return UserAccountInfo;
};

export const UserAccountBalance = async (
  Request: Request<AccountBalRequest>,
  Response: Response<ResponseSchema>
) => {
  try {
    const { accountNumber } = Request.params;
    const params = new URLSearchParams({
      ["account"]: accountNumber,
    });

    // const accountData = await needle('get', `${BASE_URL}?${params}`)
    const UserAccountInfo = await Promise.resolve({
      id: "11111111",
      acctNumber: accountNumber,
      acctBal: 50000,
      acctStatus: "active",
    });

    return NITRO_RESPONSE(Response, {
      statusCode: ResponseMapping.SUCCESSFUL.SERVER,
      status: ResponseMapping.SUCCESSFUL.MESSAGE,
      results: 1,
      data: [UserAccountInfo],
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

export const CreateUserAccount = async (
  Request: Request<{}, {}, NewAccountRequest>,
  Response: Response<ResponseSchema>
) => {
  const DatabaseClient: PoolClient = (Request as any).DatabaseClient;
  const User = (Request as any).User;

  const { BVN, RequestID, ID, ID_TYPE } = Request.body;

  try {
    const userDBDetails = await DatabaseClient.query(
      "SELECT USERID, ACCTNUMBER CUSTOMER_NAME, EMAIL, PHONENUMBER FROM NITRO_USERS WHERE USERID = $1",
      [User.userID]
    );

    if (userDBDetails.rows[0].acctnumber === null) return;

    if (userDBDetails.rows[0].acctnumber !== null) {
      const data = { ...userDBDetails.rows[0], BVN, RequestID, ID };

      const accountData = needle.post("", data, (error, res) => {
        if (error) {
          return NITRO_RESPONSE(Response, {
            statusCode: ResponseMapping.INVALID_REQUEST.SERVER,
            status: "UNABLE TO CREATE ACCOUNT",
            results: 0,
            data: null,
          });
        }

        if (res) {
          UTILS.Logger.info(
            `ACCOUNT SUCCESSFULLY CREATED FOR ${userDBDetails.rows[0].customer_name}`
          );
          DatabaseClient.query(
            "UPDATE NITRO_USERS SET ACCTNUMBER = $1, BVN = $2, ID = $3, ID_TYPE = $4 WHERE USERID = $5",
            [res.body.accountno, BVN, ID, ID_TYPE, User.userID]
          );
          return NITRO_RESPONSE(Response, {
            statusCode: ResponseMapping.SUCCESSFULLY_CREATED.SERVER,
            status: ResponseMapping.SUCCESSFULLY_CREATED.MESSAGE,
            results: 1,
            data: [res],
          });
        }
      });

      console.log(accountData);
    }
  } catch (error: any) {
    UTILS.Logger.error([error], error.message);
    return NITRO_RESPONSE(Response, {
      statusCode: ResponseMapping.SERVER_ERROR.SERVER,
      status: ResponseMapping.SERVER_ERROR.MESSAGE,
      results: 0,
      data: null,
    });
  }
};
export const FetchUserAccountStatement = () => {};
