import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import notificationController from '../controllers/notifications';
import { auth } from '../middleware/auth';

const app = new Hono();


app.use('*', auth);


const notificationSettingsSchema = z.object({
  budgetAlerts: z.boolean().optional(),
  paymentReminders: z.boolean().optional(),
  reminderDays: z.number().min(1).max(30).optional(),
  largeTransactionAlerts: z.boolean().optional(),
  largeTransactionAmount: z.number().positive().optional(),
  weeklyReports: z.boolean().optional()
});


app.get('/settings', async (c) => {
  return notificationController.getSettings(c);
});

app.patch('/settings', zValidator('json', notificationSettingsSchema), async (c) => {
  return notificationController.updateSettings(c);
});


app.get('/alerts', async (c) => {
  return notificationController.getActiveAlerts(c);
});

export default app;