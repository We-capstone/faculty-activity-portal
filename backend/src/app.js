import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './config/supabase.js'; 
import journalRoutes from './routes/journalRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import facultyRoutes from "./routes/facultyRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js"; // New Import

dotenv.config();

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount Routes
app.use('/api/journals', journalRoutes);
app.use('/api/admin', adminRoutes); 
app.use("/api/faculty", facultyRoutes);
app.use("/api/analytics", analyticsRoutes); // New Analytics Mount

// Database Connection Health Check
(async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected successfully');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
  }
})();

export default app;