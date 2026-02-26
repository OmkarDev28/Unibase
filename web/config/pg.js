import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.PG_URL,
  // ⚡️ CRITICAL: Render & AWS RDS require SSL
  ssl: {
    rejectUnauthorized: false 
  }
});

// Test the connection immediately on boot
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Database Connection Failed:', err.stack);
  }
  console.log('✅ Connected to Database');
  release();
});

export default pool;
