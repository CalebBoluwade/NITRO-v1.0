import path from "path";
import { createUserSchema, UserSchema } from "../SRC/USERS/USER.SCHEMA";
import { Application } from "express";

import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
    },
    components: {
      schemas: {
        createUserSchema: UserSchema,
      },
    },
    servers: [{ url: `http://localhost:${5000}` }],
  },
  apis: [path.join(__dirname, "../Routes/INDEX.ROUTES.ts")],
};

export const initOpenApi = (NITRO_APP: Application) => {
  // console.log(path.join(__dirname, "../SRC/USERS/USER.ROUTES.ts"))
  const specs = swaggerJsdoc(options);
  NITRO_APP.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
};
