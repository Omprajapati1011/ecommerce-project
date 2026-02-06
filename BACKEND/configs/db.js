import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

<<<<<<< HEAD
pool.getConnection((err, connection) => {
  if (err) {
    console.log("connection failed done", err.message);
  } else {
    console.log("DB connection Done");
    connection.release();
  }
});
=======
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("DB connection Done");
    connection.release();
  } catch (err) {
    console.log("Connection failed:", err.message);
  }
};

testConnection();
>>>>>>> 22d17abb44e8924ee647fe624c149ec88701b295

export default pool;
