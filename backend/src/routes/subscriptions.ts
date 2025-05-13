import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import subscriptionController from '../controllers/subscriptions';
import { auth } from '../middleware/auth';

const app = new Hono();


app.use('*', auth);


const createSubscriptionSchema = z.object({
  name: z.string().min(1, { message: 'Nom d\'abonnement requis' }),
  amount: z.number().positive({ message: 'Montant doit être positif' }),
  category: z.string().min(1, { message: 'Catégorie requise' }),
  dueDate: z.number().min(1).max(31, { message: 'Date d\'échéance invalide (1-31)' }),
  isShared: z.boolean().optional(),
  sharingRatio: z.number().min(0).max(100).optional()
});


const updateSubscriptionSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  dueDate: z.number().min(1).max(31).optional(),
  isShared: z.boolean().optional(),
  sharingRatio: z.number().min(0).max(100).optional()
});


app.get('/', async (c) => {
  return subscriptionController.getSubscriptions(c);
});


app.post('/', zValidator('json', createSubscriptionSchema), async (c) => {
  return subscriptionController.createSubscription(c);
});


app.patch('/:id', zValidator('json', updateSubscriptionSchema), async (c) => {
  return subscriptionController.updateSubscription(c);
});


app.delete('/:id', async (c) => {
  return subscriptionController.deleteSubscription(c);
});


app.get('/upcoming', async (c) => {
  return subscriptionController.getUpcomingSubscriptions(c);
});


app.get('/summary', async (c) => {
  return subscriptionController.getMonthlySummary(c);
});

export default app;