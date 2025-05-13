

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import profileController from '../controllers/profile';
import { auth } from '../middleware/auth';

const app = new Hono();


app.use('*', auth);


const updateNameSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' })
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Le mot de passe actuel est requis' }),
  newPassword: z.string().min(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
});

const changeEmailSchema = z.object({
  newEmail: z.string().email({ message: 'Format d\'email invalide' }),
  password: z.string().min(1, { message: 'Mot de passe requis' })
});


app.get('/', async (c) => {
  return profileController.getProfile(c);
});

app.patch('/name', zValidator('json', updateNameSchema), async (c) => {
  return profileController.updateName(c);
});

app.post('/change-password', zValidator('json', changePasswordSchema), async (c) => {
  return profileController.changePassword(c);
});

app.post('/change-email', zValidator('json', changeEmailSchema), async (c) => {
  return profileController.changeEmail(c);
});

app.post('/photo', async (c) => {
  return profileController.updateProfilePhoto(c);
});

app.delete('/photo', async (c) => {
  return profileController.deleteProfilePhoto(c);
});

export default app;