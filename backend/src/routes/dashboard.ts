
import { Hono } from 'hono';
import dashboardController from '../controllers/dashboard';
import { auth } from '../middleware/auth';

const app = new Hono();


app.use('*', auth);


app.get('/summary', async (c) => {
  return dashboardController.getSummary(c);
});


app.get('/forecast', async (c) => {
  return dashboardController.getMonthlyForecast(c);
});


app.get('/expenses', async (c) => {
  return dashboardController.getExpenseBreakdown(c);
});

export default app;