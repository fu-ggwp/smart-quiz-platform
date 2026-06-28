import cors from "cors";
import { env } from "./env.js";

const origins = [
  env.clientUrl,
  ...env.corsOrigins.split(","),
]
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsMiddleware = cors({
  origin: origins,
  credentials: true,
});
