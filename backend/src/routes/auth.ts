// src/routes/auth.ts - Mise à jour pour ajouter reset password

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import authController from '../controllers/auth';
import profileController from '../controllers/profile';
import { auth } from '../middleware/auth';

const app = new Hono();

// Schéma de validation pour l'inscription
const registerSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }),
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
});

// Schéma de validation pour la connexion
const loginSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }),
  password: z.string().min(1, { message: 'Mot de passe requis' })
});

// Schéma pour la réinitialisation du mot de passe
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Email invalide' })
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Token requis' }),
  newPassword: z.string().min(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
});

// Route d'inscription
app.post('/register', zValidator('json', registerSchema), async (c) => {
  return authController.register(c);
});

// Route de connexion
app.post('/login', zValidator('json', loginSchema), async (c) => {
  return authController.login(c);
});

// Route pour récupérer les informations de l'utilisateur connecté
app.get('/me', auth, async (c) => {
  return authController.me(c);
});

// Routes de réinitialisation de mot de passe (sans authentification)
app.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  return profileController.forgotPassword(c);
});

app.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  return profileController.resetPassword(c);
});

export default app;