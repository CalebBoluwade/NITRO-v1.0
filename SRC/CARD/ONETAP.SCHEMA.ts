import { date, number, object, string, TypeOf } from "zod";

export const OTC_PAY_SCHEMA = object({
  body: object({
    RequestID: string().uuid(),
    Source: string().max(11),
    Narration: string().max(75),
    CardIdentifier: string(),
    Amount: number(),
    AuthPIN: string().min(6).max(6).regex(/^\d+$/),
    TransactionLocation: object({
      latitude: number(),
      longitude: number(),
    }).optional(),
  }),
});

export const OTC_MERCHANT_CREATE_SCHEMA = object({
  body: object({
    Source: string().max(11),
    merchant_name: string().max(75),
    email: string({
      required_error: "Email is required",
    }).email("Not a valid email"),
    password: string({
      required_error: "Name is required",
    }).min(6, "6 characters minimum"),
    phonenumber: string({
      required_error: "Phone number is required",
    })
      .min(11, "Phone Number must have min. of 10 characters")
      .max(11, "Phone Number must have max. of 11 characters")
      .regex(/^\d+$/, "must contain only numbers"),
    merchant_nuban: string()
      .min(9, "NUBAN must have min. of 10 characters")
      .max(10, "NUBAN must have max. of 11 characters")
      .regex(/^\d+$/, "must contain only numbers"),
    merchant_bankcode: string().max(75),
    merchant_deviceid: string().max(100),
  }),
});

export type OneTapMerchantCreateRequest = TypeOf<
  typeof OTC_MERCHANT_CREATE_SCHEMA
>["body"];

export const OTC_CARD_LINK_SCHEMA = object({
  body: object({
    RequestID: string().uuid().optional(),
    Source: string().max(11),
    Narration: string().max(75),
    CardIdentifier: string(),
    Amount: number(),
    AuthPIN: string().min(6).max(6).regex(/^\d+$/),
    SessionID: string().min(30),
    TransactionLocation: object({
      latitude: number(),
      longitude: number(),
    }).optional(),
  }),
});

export type OneTapPaymentRequest = TypeOf<typeof OTC_PAY_SCHEMA>["body"];
