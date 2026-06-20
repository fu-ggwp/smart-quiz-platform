import express from "express";
import cors from "cors";
import healthRouter from "./features/health/health.routes.js";
import authRouter from "./features/auth/auth.routes.js";
import examsRouter from "./features/exams/exams.routes.js";
import studySetsRouter from "./features/study-sets/study-sets.routes.js";
import classesRouter from "./features/classes/classes.routes.js";
import questionBanksRouter from "./features/question-banks/question-banks.routes.js";
import usersRouter from "./features/users/users.routes.js";
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
app.use("/api/question-banks", questionBanksRouter);
app.use("/api/users", usersRouter);

export default app;
