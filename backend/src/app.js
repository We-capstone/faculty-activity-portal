import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './config/supabase.js'; 

import journalRoutes from './routes/journalRoutes.js';
import facultyRoutes from "./routes/facultyRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import orcidRoutes from "./routes/orcid.js";
import chatbotRoutes from "./routes/chatbotRoutes.js"; // ✅ NEW
import adminRoutes from "./routes/adminRoutes.js"; // ✅ Admin routes

dotenv.config();

const app = express();

// CORS configuration - allow requests from frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/journals', journalRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/orcid", orcidRoutes);
app.use("/api/chatbot", chatbotRoutes); // ✅ NEW
app.use("/api/admin", adminRoutes); // ✅ Admin routes

// Database Health Check
(async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) throw error;

    console.log('✅ Supabase connected successfully');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
  }
})();

export default app;
