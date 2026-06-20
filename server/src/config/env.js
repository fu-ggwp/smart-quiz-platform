// Centralizes and validates environment variables so the rest of the app
// never touches `process.env` directly.

const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: process.env.PORT || 5000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  databaseUrl: process.env.DATABASE_URL,
  paymentProvider: process.env.PAYMENT_PROVIDER || "stripe",
  paymentRedirectBaseUrl: process.env.PAYMENT_REDIRECT_BASE_URL || "",
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
};
