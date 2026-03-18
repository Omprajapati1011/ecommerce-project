import mysql from "mysql2/promise";
import "./env.js";

const dbPort = Number.parseInt(process.env.DB_PORT, 10) || 3306;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: dbPort,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`DB connection done on ${process.env.DB_HOST}:${dbPort}`);
    connection.release();
  } catch (err) {
    console.log(
      `DB connection failed on ${process.env.DB_HOST}:${dbPort}:`,
      err.message,
    );
  }
};

testConnection();

export default pool;
