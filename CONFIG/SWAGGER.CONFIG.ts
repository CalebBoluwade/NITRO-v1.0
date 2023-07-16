import { createUserSchema } from "../SRC/USERS/USER.SCHEMA";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NITRO SWAGGER API DOCS",
      description: "NITRO API",
      version: "0.0.1",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "DEV SERVER",
      },
      {
        url: "https://nitro-api.com",
        description: "PROD SERVER",
      },
    ],
    components: {
      schemas: {
        UserCreate: createUserSchema,
      },
    },
  },
};
