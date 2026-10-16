import express from 'express';
import cors from 'cors';
import trackRoutes from './routes/track.routes';
import readinessRoutes from './routes/readiness.routes';
import { requestDiagnostics } from './middleware/requestDiagnostics';
import searchRoutes from './routes/search.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request diagnostics middleware
// Tracks request IDs, HTTP methods, paths, status codes, and duration
app.use(requestDiagnostics);

app.get('/', (_req, res) => {
  res.type('html').send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Soundwave Backend API</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 720px;
            margin: 60px auto;
            padding: 20px;
            background: #121212;
            color: white;
          }
          a {
            display: block;
            padding: 14px;
            margin: 10px 0;
            background: #242424;
            border-radius: 8px;
            color: #8bbcff;
            text-decoration: none;
          }
          a:hover {
            background: #333;
          }
        </style>
      </head>
      <body>
        <h1>Soundwave Backend API</h1>
        <p>Server running — available GET endpoints:</p>

        <a href="/health">GET /health — Server health</a>
        <a href="/ready">GET /ready — Database readiness</a>
        <a href="/api/tracks">GET /api/tracks — Track catalog</a>
        <a href="/api/tracks/17">GET /api/tracks/17 — Track does not exist (example)</a>
        <a href="/api/search?q=midnight">GET /api/search?q=midnight — Search tracks</a>
      </body>
    </html>
  `);
});

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
app.use('/api/search', searchRoutes);


export default app;
