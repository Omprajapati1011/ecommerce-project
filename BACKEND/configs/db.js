import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.SERVER_PORT,
  waitForConnections: true,
  connectionLimit: 10,
});

// Test connection at startup
try {
  const connection = await pool.getConnection();
  console.log("✅ DB Connected Successfully");
  connection.release();
} catch (err) {
  console.error("❌ DB Connection Failed:", err.message);
}

export default pool;
