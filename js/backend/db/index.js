const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:123P3d1dos123@db.kcizzknlbhzcegsmqxrv.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params)
};
