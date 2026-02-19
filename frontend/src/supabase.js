import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://jfnbgnqmdxyfykrklphq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbmJnbnFtZHh5ZnlrcmtscGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQwMTAsImV4cCI6MjA4NTM0MDAxMH0.D4f5fiMkSKRGKiP1bYvZiOtuJp9yivxSj5sUT2A66fw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
