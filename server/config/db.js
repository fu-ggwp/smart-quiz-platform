import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mydb",
  password: "yourpassword",
  port: 5432,
});

export default pool;