import { supabase } from "../../config/supabase.js";

export async function getRoot(req, res) {
  res.send("API running...");
}

export async function getSupabaseHealth(req, res) {
  const { error } = await supabase
    .from("users")
    .select("user_id", { count: "exact", head: true });

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.json({ ok: true, message: "Supabase connected" });
}
