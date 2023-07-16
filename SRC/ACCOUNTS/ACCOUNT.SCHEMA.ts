import { object, string, number, TypeOf, boolean, date } from "zod";

export const CreateAccountSchema = object({
  body: object({
    RequestID: string().uuid(),
    Source: string({
      required_error: "No Source",
    }).nonempty(),
    // .max(11),
    AccountNo: string().min(10).max(11).regex(/^\d+$/).optional(),
    AuthPIN: string().min(6).max(6).regex(/^\d+$/),
    BVN: string().min(10).max(10).regex(/^\d+$/),
    dob: date().nullish(),
    ID: string().max(35).regex(/^\d+$/),
    ID_TYPE: string().max(15),
  }),
});

export const AccountBalanceSchema = object({
  params: object({
    accountNumber: string().min(10).max(11).regex(/^\d+$/),
  }),
});

export type NewAccountRequest = TypeOf<typeof CreateAccountSchema>["body"];
export type AccountBalRequest = TypeOf<typeof AccountBalanceSchema>["params"];
