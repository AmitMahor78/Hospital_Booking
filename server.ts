import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth.ts';
import hospitalRoutes from './server/routes/hospitals.ts';
import doctorRoutes from './server/routes/doctors.ts';
import appointmentRoutes from './server/routes/appointments.ts';
import queueRoutes from './server/routes/queue.ts';
import benefitRoutes from './server/routes/benefits.ts';
import auditRoutes from './server/routes/audit.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/benefits', benefitRoutes);
app.use('/api/audit', auditRoutes);

// System health and configuration check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    app: 'SWASTHYAQUEUE',
    tagline: 'Appointment se Consultation tak — Queue ko Simple Banayein',
    governmentApiEnabled: process.env.GOVERNMENT_API_ENABLED === 'true',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Vite middleware in dev or static files in production
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SwasthyaQueue Server] Running on http://0.0.0.0:${PORT}`);
    console.log(
      `[SwasthyaQueue] Government API Mode: ${
        process.env.GOVERNMENT_API_ENABLED === 'true' ? 'AUTHORIZED' : 'DEMO/SANDBOX'
      }`
    );
  });
}

startServer();
