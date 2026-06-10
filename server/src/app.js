import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.routes.js";
import authRouter from "./features/auth/auth.routes.js";
import examsRouter from "./features/exams/exams.routes.js";
import studySetsRouter from "./features/study-sets/study-sets.routes.js";
import classesRouter from "./features/classes/classes.routes.js";
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
app.use("/api/study-sets", studySetsRouter);
app.use("/api/classes", classesRouter);

export default app;
