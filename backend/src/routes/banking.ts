import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bankingController from '../controllers/banking';
import { auth } from '../middleware/auth';

const app = new Hono();


app.use('*', auth);


const connectionSchema = z.object({
  institutionId: z.string().min(1, { message: 'ID d\'institution requis' })
});


app.get('/institutions', async (c) => {
  return bankingController.getInstitutions(c);
});


app.post('/connect', zValidator('json', connectionSchema), async (c) => {
  return bankingController.initiateConnection(c);
});


app.get('/callback', async (c) => {
  return bankingController.handleCallback(c);
});


app.post('/sync', async (c) => {
  return bankingController.syncTransactions(c);
});


app.get('/balances', async (c) => {
  return bankingController.getAccountBalances(c);
});

export default app;