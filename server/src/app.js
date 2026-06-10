import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.routes.js";
import authRouter from "./features/auth/auth.routes.js";
import examsRouter from "./features/exams/exams.routes.js";
import { swaggerSpec, swaggerUi } from "./config/swagger.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/openapi.json", (req, res) => {
  res.json(swaggerSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/exams", examsRouter);

export default app;
