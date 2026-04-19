import app from './config/app.js'
import dotenv from 'dotenv';
dotenv.config();

/**
 * index.js - MunchMate Server Root
 *
 * This file binds solely to launching the fully built Express application globally.
 * Contains no middleware logic, no route defining logic, and no database configuration,
 * keeping the instantiation explicitly restricted explicitly to environment scoping.
 */

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server live at http://${HOST}:${PORT}`);
});

export default server;
