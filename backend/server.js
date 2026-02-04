// server.js - Backend API for NZ Home Loan Rates Tracker
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  // Connection pool settings for Railway
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: false
});

// Test database connection on startup
pool.connect((err, client, done) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('DATABASE_URL:', process.env.DATABASE_URL ? '***set***' : 'NOT SET');
  } else {
    console.log('✅ Database connected successfully');
    done();
  }
});

// Database initialization
const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS banks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        website VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rates (
        id SERIAL PRIMARY KEY,
        bank_id INTEGER REFERENCES banks(id) ON DELETE CASCADE,
        rate_date DATE NOT NULL,
        term_1year DECIMAL(5,3),
        term_2year DECIMAL(5,3),
        term_3year DECIMAL(5,3),
        term_5year DECIMAL(5,3),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(bank_id, rate_date)
      );

      CREATE TABLE IF NOT EXISTS rate_alerts (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        bank_id INTEGER REFERENCES banks(id),
        term VARCHAR(20) NOT NULL,
        threshold_rate DECIMAL(5,3) NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_rates_date ON rates(rate_date DESC);
      CREATE INDEX IF NOT EXISTS idx_rates_bank ON rates(bank_id);
    `);

    // Insert NZ banks if they don't exist
    const nzBanks = [
      { name: 'ANZ', website: 'https://www.anz.co.nz' },
      { name: 'ASB', website: 'https://www.asb.co.nz' },
      { name: 'BNZ', website: 'https://www.bnz.co.nz' },
      { name: 'Westpac', website: 'https://www.westpac.co.nz' },
      { name: 'Kiwibank', website: 'https://www.kiwibank.co.nz' },
      { name: 'TSB', website: 'https://www.tsbbank.co.nz' },
      { name: 'SBS', website: 'https://www.sbsbank.co.nz' },
      { name: 'Cooperative Bank', website: 'https://www.co-operativebank.co.nz' },
      { name: 'HSBC', website: 'https://www.hsbc.co.nz' },
      { name: 'China Construction Bank', website: 'https://www.nz.ccb.com' }
    ];

    for (const bank of nzBanks) {
      await client.query(
        'INSERT INTO banks (name, website) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [bank.name, bank.website]
      );
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  } finally {
    client.release();
  }
};

// API Routes

// Get all banks
app.get('/api/banks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM banks ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all rates with optional filters
app.get('/api/rates', async (req, res) => {
  try {
    const { bank_id, start_date, end_date, term } = req.query;
    
    let query = `
      SELECT r.*, b.name as bank_name 
      FROM rates r
      JOIN banks b ON r.bank_id = b.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (bank_id) {
      query += ` AND r.bank_id = $${paramCount}`;
      params.push(bank_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND r.rate_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND r.rate_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ' ORDER BY r.rate_date DESC, b.name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get latest rates for all banks
app.get('/api/rates/latest', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (b.id) 
        r.*, b.name as bank_name, b.website
      FROM rates r
      JOIN banks b ON r.bank_id = b.id
      ORDER BY b.id, r.rate_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get best rates for a specific term
app.get('/api/rates/best/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const validTerms = ['term_1year', 'term_2year', 'term_3year', 'term_5year'];
    
    if (!validTerms.includes(term)) {
      return res.status(400).json({ error: 'Invalid term' });
    }

    const result = await pool.query(`
      SELECT DISTINCT ON (b.id) 
        r.*, b.name as bank_name, b.website
      FROM rates r
      JOIN banks b ON r.bank_id = b.id
      WHERE r.${term} IS NOT NULL
      ORDER BY b.id, r.rate_date DESC
    `);

    // Sort by the specific term rate
    const sortedRates = result.rows.sort((a, b) => 
      parseFloat(a[term]) - parseFloat(b[term])
    );

    res.json(sortedRates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new rate
app.post('/api/rates', async (req, res) => {
  try {
    const { bank_id, rate_date, term_1year, term_2year, term_3year, term_5year } = req.body;

    if (!bank_id || !rate_date) {
      return res.status(400).json({ error: 'bank_id and rate_date are required' });
    }

    const result = await pool.query(
      `INSERT INTO rates (bank_id, rate_date, term_1year, term_2year, term_3year, term_5year)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (bank_id, rate_date) 
       DO UPDATE SET 
         term_1year = EXCLUDED.term_1year,
         term_2year = EXCLUDED.term_2year,
         term_3year = EXCLUDED.term_3year,
         term_5year = EXCLUDED.term_5year
       RETURNING *`,
      [bank_id, rate_date, term_1year, term_2year, term_3year, term_5year]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk insert rates
app.post('/api/rates/bulk', async (req, res) => {
  const client = await pool.connect();
  try {
    const { rates } = req.body;

    if (!Array.isArray(rates) || rates.length === 0) {
      return res.status(400).json({ error: 'rates array is required' });
    }

    await client.query('BEGIN');

    const insertedRates = [];
    for (const rate of rates) {
      const result = await client.query(
        `INSERT INTO rates (bank_id, rate_date, term_1year, term_2year, term_3year, term_5year)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (bank_id, rate_date) 
         DO UPDATE SET 
           term_1year = EXCLUDED.term_1year,
           term_2year = EXCLUDED.term_2year,
           term_3year = EXCLUDED.term_3year,
           term_5year = EXCLUDED.term_5year
         RETURNING *`,
        [rate.bank_id, rate.rate_date, rate.term_1year, rate.term_2year, rate.term_3year, rate.term_5year]
      );
      insertedRates.push(result.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ count: insertedRates.length, rates: insertedRates });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Create rate alert
app.post('/api/alerts', async (req, res) => {
  try {
    const { user_email, bank_id, term, threshold_rate } = req.body;

    if (!user_email || !term || !threshold_rate) {
      return res.status(400).json({ error: 'user_email, term, and threshold_rate are required' });
    }

    const result = await pool.query(
      'INSERT INTO rate_alerts (user_email, bank_id, term, threshold_rate) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_email, bank_id, term, threshold_rate]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user alerts
app.get('/api/alerts/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query(
      `SELECT a.*, b.name as bank_name 
       FROM rate_alerts a
       LEFT JOIN banks b ON a.bank_id = b.id
       WHERE a.user_email = $1 AND a.active = true
       ORDER BY a.created_at DESC`,
      [email]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server: listen immediately so healthchecks succeed, initialize DB in background
const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Initialize DB but don't block server startup; log errors instead of crashing
  try {
    await initDB();
  } catch (err) {
    console.error('Database initialization failed (continuing without DB):', err && err.message ? err.message : err);
  }
};

startServer();

module.exports = app;