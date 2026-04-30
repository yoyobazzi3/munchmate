import mysql from 'mysql2';
import dotenv from 'dotenv';

// Ensure environment variables are loaded for the database configuration
dotenv.config();

// Create a connection pool to manage multiple concurrent database connections efficiently
const pool = mysql.createPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // In production on Cloud Run, connect via Unix socket to Cloud SQL.
  // Locally, connect via TCP host:port.
  ...(process.env.INSTANCE_CONNECTION_NAME
    ? { socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}` }
    : { host: process.env.DB_HOST, port: process.env.DB_PORT || 3306 }),
  connectionLimit: 4,
});

// Upgrade the pool to use Promises instead of callbacks for modern async/await syntax
const promisePool = pool.promise();

/**
 * A helper function to execute an SQL query directly and return the rows.
 * @param {string} query - The SQL query string to execute.
 * @param {Array|Object} [params] - Optional values to bind to the query to prevent SQL injection.
 * @returns {Promise<Array>} The resulting rows from the executed query.
 */
export const queryDB = async (query, params) => {
    const [rows] = await promisePool.query(query, params);
    return rows;
};

export default promisePool;