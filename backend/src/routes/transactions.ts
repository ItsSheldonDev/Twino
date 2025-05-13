import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import transactionController from '../controllers/transactions';
import { auth } from '../middleware/auth';

const app = new Hono();


app.use('*', auth);


const updateTransactionSchema = z.object({
  category: z.string().optional(),
  description: z.string().optional(),
  isShared: z.boolean().optional(),
  sharingRatio: z.number().min(0).max(100).optional()
});


app.get('/', async (c) => {
  return transactionController.getTransactions(c);
});


app.get('/latest', async (c) => {
  return transactionController.getLatestTransactions(c);
});


app.patch('/:id', zValidator('json', updateTransactionSchema), async (c) => {
  return transactionController.updateTransaction(c);
});


app.get('/categories', async (c) => {
  return transactionController.getTransactionCategories(c);
});


app.get('/stats', async (c) => {
  return transactionController.getMonthlyStats(c);
});

export default app;