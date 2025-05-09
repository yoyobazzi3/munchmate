import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

const promisePool = pool.promise();

export const queryDB = async (query, params) => {
    const [rows] = await promisePool.query(query, params);
    return rows;
};

export default promisePool;