const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  clientUrl: process.env.CLIENT_URL || "",
  corsOrigins: process.env.CORS_ORIGINS || "",

  port: process.env.PORT || 5000,

  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",

  brevoApiKey: process.env.BREVO_API_KEY,
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL,
  brevoSenderName: process.env.BREVO_SENDER_NAME,

  paymentProvider: process.env.PAYMENT_PROVIDER || "stripe",
  payosClientId: process.env.PAYOS_CLIENT_ID,
  payosApiKey: process.env.PAYOS_API_KEY,
  payosChecksumKey: process.env.PAYOS_CHECKSUM_KEY,
  payosReturnUrl: process.env.PAYOS_RETURN_URL,
  payosCancelUrl: process.env.PAYOS_CANCEL_URL,
};
