import express from 'express';
import cors from 'cors';
import trackRoutes from './routes/track.routes';
import readinessRoutes from './routes/readiness.routes';
import { requestDiagnostics } from './middleware/requestDiagnostics';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request diagnostics middleware
// Tracks request IDs, HTTP methods, paths, status codes, and duration
app.use(requestDiagnostics);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'soundwave-backend'
  });
});

// Application readiness check
// Verifies that the backend can communicate with PostgreSQL
app.use('/ready', readinessRoutes);

// Track API routes
app.use('/api/tracks', trackRoutes);

export default app;
