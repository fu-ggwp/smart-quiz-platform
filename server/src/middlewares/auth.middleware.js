import supabase from "../config/supabase.js";
import { USER_TABLE } from "../models/user.model.js";
// Verifies the Supabase JWT sent in the Authorization header and attaches
// the resolved user to `req.user`. Use on any route that requires login.
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: "Missing access token" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }

  req.user = data.user;
  try {
    const { data: dbUser } = await supabase
      .from(USER_TABLE)
      .select("active_role")
      .eq("user_id", data.user.id)
      .single();
    if (dbUser) {
      req.user.role = dbUser.active_role; // Gán quyền từ DB vào đối tượng user
    }
  } catch (dbErr) {
    console.error("Failed to query user role in requireAuth:", dbErr);
  }
  next();
}
