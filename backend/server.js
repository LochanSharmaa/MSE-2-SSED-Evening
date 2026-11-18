const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { createClient } = require('redis');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database Configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgrespassword',
  database: process.env.DB_NAME || 'postgres',
  connectionTimeoutMillis: 5000,
});

// Redis Configuration
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`,
});

let isRedisConnected = false;
let isPostgresConnected = false;

redisClient.on('connect', () => {
  console.log('Connected to Redis successfully');
  isRedisConnected = true;
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
  isRedisConnected = false;
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.warn('Initial Redis connection failed, will retry...');
  }
})();

// Initialize PostgreSQL table
async function initDb() {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    client.release();
    isPostgresConnected = true;
    console.log('Connected to PostgreSQL and initialized table');
  } catch (err) {
    console.error('PostgreSQL initialization error:', err.message);
    isPostgresConnected = false;
  }
}

initDb();

// Health check endpoint required for Docker health checks
app.get('/health', async (req, res) => {
  let pgStatus = 'DOWN';
  let redisStatus = 'DOWN';

  try {
    const resPg = await pool.query('SELECT 1');
    if (resPg) pgStatus = 'UP';
  } catch (e) {
    pgStatus = 'DOWN';
  }

  try {
    if (redisClient.isOpen) {
      await redisClient.ping();
      redisStatus = 'UP';
    }
  } catch (e) {
    redisStatus = 'DOWN';
  }

  const isHealthy = pgStatus === 'UP' && redisStatus === 'UP';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    postgres: pgStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
});

// API Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running successfully' });
});

// API endpoint demonstrating persistence and caching
app.get('/api/data', async (req, res) => {
  try {
    // Record view in PostgreSQL
    await pool.query('INSERT INTO page_views DEFAULT VALUES');
    const pgCountResult = await pool.query('SELECT COUNT(*) FROM page_views');
    const totalViews = pgCountResult.rows[0].count;

    // Cache in Redis
    let redisCount = 0;
    if (redisClient.isOpen) {
      redisCount = await redisClient.incr('visit_count');
    }

    res.json({
      message: 'Hello from MSE-2 Backend Service!',
      postgres_total_records: totalViews,
      redis_cached_visits: redisCount,
      environment: process.env.NODE_ENV,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server listening on port ${PORT}`);
});
