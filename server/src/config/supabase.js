import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const supabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey);
const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

export { supabaseClient, supabase };
