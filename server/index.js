import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import supabase from "./config/supabase.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running...");
});

app.get("/health/supabase", async (req, res) => {
  const { error } = await supabase.from("profiles").select("id").limit(1);

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.json({ ok: true, message: "Supabase connected" });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
