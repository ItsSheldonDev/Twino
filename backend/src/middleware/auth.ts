import type { Context, Next } from 'hono';
import { verifyToken } from '../utils/jwt';

export const auth = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Non autorisé. Token manquant.' }, 401);
  }
  
  const token = authHeader.split(' ')[1] || '';
  const payload = verifyToken(token);
  
  if (!payload) {
    return c.json({ error: 'Non autorisé. Token invalide.' }, 401);
  }
  
  c.set('user', payload);
  
  await next();
};