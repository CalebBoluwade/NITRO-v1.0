// const X = typeof<ResponseCodeMapping>;

export const ResponseMapping = {
  SUCCESSFUL: {
    CODE: "00",
    MESSAGE: "SUCCESSFUL",
    SERVER: 200,
  },
  SUCCESSFULLY_CREATED: {
    CODE: "00",
    MESSAGE: "SUCCESSFULLY CREATED",
    SERVER: 201,
  },
  INVALID_TRANSFER: {
    CODE: "99",
    MESSAGE: "INVALID TRANSFER REQUEST",
    SERVER: 400,
  },
  INCORRECT_TPIN: {
    CODE: "99",
    MESSAGE: "TRANSACTION PIN MISMATCH",
    SERVER: 400,
  },
  INCORRECT_LOGIN_EMAIL: {
    CODE: "99",
    MESSAGE: "INCORRECT EMAIL / PASSWORD",
    SERVER: 400,
  },
  INCORRECT_LOGIN_PHONE: {
    CODE: "99",
    MESSAGE: "INCORRECT PHONE NUMBER / PASSWORD",
    SERVER: 400,
  },
  INVALID_REQUEST: {
    CODE: "99",
    MESSAGE: "INVALID REQUEST",
    SERVER: 400,
  },
  INVALID_REQUEST_USER: {
    CODE: "99",
    MESSAGE: "USER ALREADY EXISTS",
    SERVER: 400,
  },
  ACCT_LOCKED: {
    CODE: "99",
    MESSAGE: "PROFILE LOCKED. TOO MANY WRONG ATTEMPS",
    SERVER: 400,
  },
  DUPLICATE_REQUEST: {
    CODE: "99",
    MESSAGE: "DUPLICATE TRANSACTION REQUEST",
    SERVER: 400,
  },
  INSUFFICIENT_FUNDS: {
    CODE: "54",
    MESSAGE: "FAILED DUE TO INSUFFICIENT FUNDS",
    SERVER: 400,
  },
  NOT_FOUND: {
    CODE: "44",
    MESSAGE: "NOT FOUND",
    SERVER: 404,
  },
  SERVER_ERROR: {
    CODE: "99",
    MESSAGE: "SERVER ERROR",
    SERVER: 500,
  },
};

export class NIPResponseCode {
  public static SUCCESSFUL = "00";
  public static INVALID_SENDER = "03";
  public static DO_NOT_HONOR = "05";
  public static DORMANT_ACCOUNT = "06";
  public static INVALID_ACCOUNT = "07";
  public static ACCOUNT_NAME_MISMATCH = "08";
  public static WIP = "09";
  public static INVALID_TRANSACTION = "12";
  public static INVALID_AMOUNT = "13";
  public static INVALID_BATCH_NUMBER = "14";
  public static INVALID_SESSION_OR_RECORD_ID = "15";
  public static UNKNOWN_BANK_CODE = "16";
  public static INVALID_CHANNEL = "17";
  public static WRONG_METHOD_CALL = "18";
  public static NO_ACTION_TAKEN = "21";
  public static UNABLE_TO_LOCATE_RECORD = "25";
  public static DUPLICATE_RECORD = "26";
  public static FORMAT_ERROR = "30";
  public static SUSPECTED_FRAUD = "34";
  public static CONTACT_SENDING_BANK = "35";
  public static NO_SUFFICIENT_FUNDS = "51";
  public static TRANSACTION_NOT_PERMITTED_TO_SENDER = "57";
  public static TRANSACTION_NOT_PERMITTED_ON_CHANNEL = "58";
  public static TRANSFER_LIMIT_EXCEEDED = "61";
  public static SECURITY_VIOLATION = "63";
  public static EXCEEDS_WITHDRAWAL_FREQUENCY = "65";
  public static RESPONSE_RECEIVED_TOO_LATE = "68";
  public static BENEFICIARY_BANK_NOT_AVAILABLE = "91";
  public static ROUTING_ERROR = "92";
  public static DUPLICATE_TRANSACTION = "94";
  public static SYSTEM_MALFUNCTION = "96";
  public static TIMEOUT_WAITING_FOR_RESPONSE_FROM_DESTINATION = "97";
}

// const NIPResponse = new NIPResponseCode();
// NIPResponse.
