// app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import serviceAreaRoute from './routes/ServiceAreaRoutes.js';
import customerRoute from './routes/CustomerRoutes.js';
import connectionRoute from './routes/ConnectionRoutes.js';
import teamRoute from './routes/teamRoutes.js';
import adminRoute from './routes/adminRoutes.js';
import planRoutes from './routes/PlanRoutes.js';
import ticketRoutes from './routes/supportTicketRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Allow multiple origins
const allowedOrigins = [
  process.env.CLIENT_CUSTOMER_URL,
  process.env.CLIENT_ADMIN_URL,
  process.env.CLIENT_TEAM_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// Middlewares
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.send('✅ MWFibernet API is running.');
});

// Mount routes
app.use('/api/service-areas', serviceAreaRoute);
app.use('/api/customers', customerRoute);
app.use('/api/connections', connectionRoute);
app.use('/api/team', teamRoute);
app.use('/api/admin', adminRoute);
app.use('/api/plans', planRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route Not Found' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
