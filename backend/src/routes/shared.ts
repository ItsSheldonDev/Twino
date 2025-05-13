import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import sharedController from '../controllers/shared';
import { auth } from '../middleware/auth';

const app = new Hono();


app.use('*', auth);


const sharedExpenseSchema = z.object({
  description: z.string().min(1, { message: 'Description requise' }),
  amount: z.number().positive({ message: 'Montant doit être positif' }),
  category: z.string().optional(),
  date: z.string().min(1, { message: 'Date requise' }),
  partnerId: z.string().min(1, { message: 'ID du partenaire requis' }),
  splitRatio: z.number().min(0).max(100, { message: 'Ratio de partage entre 0 et 100' })
});


const updateSharedExpenseSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  category: z.string().optional(),
  date: z.string().optional(),
  splitRatio: z.number().min(0).max(100).optional(),
  isSettled: z.boolean().optional()
});


app.get('/expenses', async (c) => {
  return sharedController.getSharedExpenses(c);
});

app.post('/expenses', zValidator('json', sharedExpenseSchema), async (c) => {
  return sharedController.createSharedExpense(c);
});

app.patch('/expenses/:id', zValidator('json', updateSharedExpenseSchema), async (c) => {
  return sharedController.updateSharedExpense(c);
});

app.delete('/expenses/:id', async (c) => {
  return sharedController.deleteSharedExpense(c);
});


app.get('/balance', async (c) => {
  return sharedController.getBalanceSummary(c);
});


app.post('/settle', async (c) => {
  return sharedController.settleUpBalance(c);
});

export default app;