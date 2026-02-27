import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function executeSQL(sql) {

  const { data, error } = await supabase.rpc("run_chatbot_query", {
    query: sql
  });

  if (error) throw error;

  return data;
}