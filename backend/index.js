import app from './config/app.js'
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT;
const HOST = process.env.HOST;
const server = app.listen(PORT, process.env.HOST, () => {
  console.log(`Server live at http://${HOST}:${PORT} `)
})

export default server;
