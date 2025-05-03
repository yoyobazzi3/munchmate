import app from './config/app.js'
import dotenv from 'dotenv';

dotenv.config();

const server = app.listen(process.env.PORT, process.env.HOST, () => {
  console.log(`Server live `)
})

export default server;
