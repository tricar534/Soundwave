import express from 'express';
import cors from 'cors';
import trackRoutes from './routes/track.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'soundwave-backend' });
});

app.use('/api/tracks', trackRoutes);

export default app;