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

// Validate required environment variables at startup
const REQUIRED_ENV_VARS = ['JWT_SECRET'];
const missingEnvVars = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://crownridge-lead-system-final.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    console.log("Origin:", origin);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
