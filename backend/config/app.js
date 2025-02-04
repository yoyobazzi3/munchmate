import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';


const app = express();



app.use(cors()); 
app.use(morgan('dev')); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 


app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;