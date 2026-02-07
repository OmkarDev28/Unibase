import { Pool } from "pg";
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.PG_URL,
    rejectUnauthorized: false
});

export default pool;