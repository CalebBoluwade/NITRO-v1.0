import { Pool } from "pg";

export const PGpool = new Pool({
  user: "postgres",
  password: "qwertyuiop",
  host: "localhost",
  port: 5432,
  database: "NITRO_MOBILE",
});
