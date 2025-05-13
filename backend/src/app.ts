import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { PrismaClient } from '@prisma/client';

import Config from './config';
import authRoutes from './routes/auth';
import bankingRoutes from './routes/banking';
import transactionRoutes from './routes/transactions';
import subscriptionRoutes from './routes/subscriptions';
import savingsRoutes from './routes/savings';
import dashboardRoutes from './routes/dashboard';
import sharedRoutes from './routes/shared';
import notificationRoutes from './routes/notifications';
import profileRoutes from './routes/profile';

export const prisma = new PrismaClient();

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400,
  credentials: true
}));
app.use('*', prettyJSON());

app.onError((err, c) => {
  console.error(`[ERROR] ${err.message}`, err.stack);
  return c.json({ 
    error: err.message || 'Une erreur est survenue',
    status: 'error'
  }, 500);
});

app.route('/api/auth', authRoutes);
app.route('/api/banking', bankingRoutes);
app.route('/api/transactions', transactionRoutes);
app.route('/api/subscriptions', subscriptionRoutes);
app.route('/api/savings', savingsRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/shared', sharedRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/profile', profileRoutes);

app.get('/', (c) => {
  return c.json({ 
    status: 'online',
    version: '1.0.0',
    message: 'Couple Budget API'
  });
});

export default app;