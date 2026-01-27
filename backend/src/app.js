import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
})();

app.get('/', (req, res) => {
  res.send('Faculty Performance System API is running');
});

const [rows] = await pool.query(
  'SELECT * FROM faculty WHERE faculty_id = 2',

);
console.log(rows); 
export default app;
