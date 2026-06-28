import "dotenv/config";
import app from "./src/app.js";
import { env } from "./src/config/env.js";

const port = Number(env.port);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
