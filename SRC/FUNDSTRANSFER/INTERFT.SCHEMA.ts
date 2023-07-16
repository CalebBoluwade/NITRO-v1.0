import { object, string, number, TypeOf, boolean } from "zod";

export const FTSchema = object({
  body: object({
    Amount: number(),
    RequestID: string().uuid(),
    Source: string().max(11),
    DebitAccountNo: string().min(10).max(11).regex(/^\d+$/),
    CreditAccountNo: string().min(10).max(11).regex(/^\d+$/),
    CreditAccountName: string().min(8).max(45),
    CreditInstitutionCode: string(),
    AuthPIN: string().min(6).max(6).regex(/^\d+$/),
    Beneficiary: boolean(),
    BVN: string().max(10).regex(/^\d+$/),
    Narration: string().max(100).nullish(),
    SessionID: string().min(30),
    TransactionLocation: object({
      latitude: number(),
      longitude: number(),
    }).optional(),
  }),
});

export const NERequestSchema = object({
  params: object({
    accountNumber: string({
      required_error: "account number is required",
    })
      .min(10, "account number must have a 10 numbers")
      .max(10, "Invalid account number")
      .regex(/^[0-9]+$/),
    bankCode: string({
      required_error: "Name is required",
    })
      .min(3, "Invalid bank code")
      .max(6, "Invalid bank code")
      .regex(/^[0-9]+$/),
  }),
});

export interface NE_RESPONSE {
  accountname: String;
  accountno: string;
  bankname: string;
  status: string;
  bankcode: string;
  statusmessage: string;
  bvn: number;
  readonly sessionid: string;
}

export type NewFTRequest = TypeOf<typeof FTSchema>["body"];

export type NERequest = TypeOf<typeof NERequestSchema>["params"];
