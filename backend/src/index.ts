import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testDatabaseConnection } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'soundwave-backend' });
});

app.get('/health/database', async (_req, res) => {
  try {
    const result = await testDatabaseConnection();

    res.json({
      status: 'ok',
      service: 'soundwave-database',
      databaseTime: result.now,
    });
  } catch (error) {
    console.error('Database connection failed:', error);

    res.status(500).json({
      status: 'error',
      service: 'soundwave-database',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
