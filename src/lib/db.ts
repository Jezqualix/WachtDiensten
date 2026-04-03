import sql from "mssql";

const config: sql.config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "WachtdienstDB",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  port: parseInt(process.env.DB_PORT || "1433"),
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getDb(): Promise<sql.ConnectionPool> {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}

export default sql;
