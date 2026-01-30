import app from './config/app.js'
import dotenv from 'dotenv';
import { connectDB } from './config/mongodb.js';

dotenv.config();

const PORT = process.env.PORT;
const HOST = process.env.HOST;

// Initialize MongoDB connection
connectDB().catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err);
  process.exit(1);
});

const server = app.listen(PORT, process.env.HOST, () => {
  console.log(`Server live at http://${HOST}:${PORT} `)
})

export default server;
