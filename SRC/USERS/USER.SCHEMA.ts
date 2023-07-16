import { date, object, string, TypeOf } from "zod";

export const createUserSchema = object({
  body: object({
    customer_name: string({
      required_error: "CUSTOMER NAME is required",
    }),
    email: string({
      required_error: "Email is required",
    }).email("Not a valid email"),
    password: string({
      required_error: "Name is required",
    }).min(6, "6 characters minimum"),
    tpin: string({
      required_error: "TPIN is required",
    })
      .min(6, "Min. of 6")
      .max(6, "Max. of 6")
      .regex(/^\d+$/, "OTP must contain only numbers"),
    phonenumber: string({
      required_error: "Phone number is required",
    })
      .min(11, "Phone Number must have min. of 10 characters")
      .max(11, "Phone Number must have max. of 11 characters")
      .regex(/^\d+$/, "must contain only numbers"),
    userpushid: string({}).nullish(),
    ipaddress: string().ip({
      version: "v4",
    }),
    status: string({}).nullable().optional(),
    userid: string().uuid().optional(),
    appverion: string({}),
    device: string({}),
  }),
});

export const UserEmailAuthSchema = object({
  body: object({
    email: string({
      required_error: "Email is required",
      description: "email",
    }).email("Not a valid email"),
    password: string({
      required_error: "Name is required",
    }).min(6, "Min. of 6"),
    ipaddress: string().ip({
      version: "v4",
    }),
    appverion: string({}),
    device: string({}),
  }),
});

export const PasswordResetSchema = object({
  body: object({
    email: string({
      required_error: "Email is required",
    })
      .email("Not a valid email")
      .nullish(),
    phonenumber: string({
      required_error: "Phone number is required",
    })
      .min(11, "Phone Number must have min. of 10 characters")
      .max(11, "Phone Number must have max. of 11 characters")
      .regex(/^\d+$/, "must contain only numbers")
      .nullable(),
  }),
});

export const PasswordCallBackResetSchema = object({
  query: object({
    id: string().uuid(),
    token: string().uuid(),
  }),
});
export type CreateUserRequest = TypeOf<typeof createUserSchema>["body"];

export type EmailAuthRequest = TypeOf<typeof UserEmailAuthSchema>["body"];

export type PasswordResetRequest = TypeOf<typeof PasswordResetSchema>["body"];

export type PasswordResetCallBackRequest = TypeOf<
  typeof PasswordCallBackResetSchema
>["query"];

export const UserSchema = object({
  user: createUserSchema,
});
