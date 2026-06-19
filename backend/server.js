import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Middleware Imports
import { errorHandler } from './middleware/errorMiddleware.js';
import { activityLogger } from './middleware/activityLogger.js';

// Init environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(activityLogger);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'IT Consultancy Scoring System API is operational.' });
});

// Route Integrations
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  API server running on http://localhost:${PORT}`);
  console.log(`  Development DB Connected (Prisma SQLite)`);
  console.log(`==================================================`);
});

export default app;
