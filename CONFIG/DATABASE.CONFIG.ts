import { Pool } from "pg";

export const PGpool = new Pool({
  user: "postgres",
  password: "qwertyuiop",
  host: "localhost",
  port: 5432,
  database: "NITRO_MOBILE",
  idleTimeoutMillis: 30000,
  application_name: "NITRO_API",
  query_timeout: 30000,
});
