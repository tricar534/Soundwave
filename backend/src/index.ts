import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import trackRoutes from './routes/track.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'soundwave-backend' });
});

app.use('/api/tracks', trackRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});