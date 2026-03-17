const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.kcizzknlbhzcegsmqxrv:123P3d1dos123@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params)
};
