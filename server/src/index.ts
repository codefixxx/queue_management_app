import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import queueRoutes from './routes/queue.routes';
import tokenRoutes from './routes/token.routes';
import analyticsRoutes from './routes/analytics.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Queue Management API'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api', tokenRoutes);
app.use('/api/analytics', analyticsRoutes);

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Queue Management API server running on http://localhost:${PORT}`);
});

export default app;

