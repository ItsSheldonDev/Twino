
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import savingsController from '../controllers/savings';
import { auth } from '../middleware/auth';

const app = new Hono();


app.use('*', auth);


const savingsAccountSchema = z.object({
  type: z.string().min(1, { message: 'Type de compte requis' }),
  name: z.string().min(1, { message: 'Nom de compte requis' }),
  balance: z.number().min(0).optional(),
  monthlyContribution: z.number().min(0),
  interestRate: z.number().min(0).optional()
});

const savingsGoalSchema = z.object({
  name: z.string().min(1, { message: 'Nom d\'objectif requis' }),
  targetAmount: z.number().positive({ message: 'Montant cible doit être positif' }),
  currentAmount: z.number().min(0).optional(),
  deadline: z.string().optional(),
  isShared: z.boolean().optional()
});


app.get('/accounts', async (c) => {
  return savingsController.getSavingsAccounts(c);
});

app.post('/accounts', zValidator('json', savingsAccountSchema), async (c) => {
  return savingsController.createSavingsAccount(c);
});

app.patch('/accounts/:id', async (c) => {
  return savingsController.updateSavingsAccount(c);
});

app.delete('/accounts/:id', async (c) => {
  return savingsController.deleteSavingsAccount(c);
});


app.get('/goals', async (c) => {
  return savingsController.getSavingsGoals(c);
});

app.post('/goals', zValidator('json', savingsGoalSchema), async (c) => {
  return savingsController.createSavingsGoal(c);
});

app.patch('/goals/:id', async (c) => {
  return savingsController.updateSavingsGoal(c);
});

app.delete('/goals/:id', async (c) => {
  return savingsController.deleteSavingsGoal(c);
});


app.get('/summary', async (c) => {
  return savingsController.getSavingsSummary(c);
});

export default app;