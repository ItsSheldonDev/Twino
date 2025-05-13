import type { Context } from 'hono';
import { prisma } from '../app';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { generateToken } from '../utils/jwt';
import Config from '../config';

// Interface pour les données d'inscription
interface RegisterData {
  email: string;
  name: string;
  password: string;
}

// Interface pour les données de connexion
interface LoginData {
  email: string;
  password: string;
}

export class AuthController {
  async register(c: Context) {
    try {
      const data = await c.req.json() as RegisterData;
      
      // Vérification du nombre d'utilisateurs existants
      const userCount = await prisma.user.count();
      if (userCount >= Config.MAX_USERS) {
        return c.json({ 
          error: 'Le nombre maximum d\'utilisateurs a été atteint' 
        }, 403);
      }
      
      // Vérification si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });
      
      if (existingUser) {
        return c.json({ 
          error: 'Un utilisateur avec cet email existe déjà' 
        }, 409);
      }
      
      // Hachage du mot de passe
      const passwordHash = await hashPassword(data.password);
      
      // Création de l'utilisateur
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash,
          // Création des paramètres de notification par défaut
          notificationSettings: {
            create: {}
          }
        }
      });
      
      // Génération du token
      const token = generateToken(user.id, user.email);
      
      return c.json({
        message: 'Inscription réussie',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }, 201);
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return c.json({ 
        error: 'Erreur lors de l\'inscription' 
      }, 500);
    }
  }
  
  async login(c: Context) {
    try {
      const data = await c.req.json() as LoginData;
      
      // Recherche de l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });
      
      if (!user) {
        return c.json({ 
          error: 'Identifiants invalides' 
        }, 401);
      }
      
      // Vérification du mot de passe
      const isPasswordValid = await verifyPassword(user.passwordHash, data.password);
      
      if (!isPasswordValid) {
        return c.json({ 
          error: 'Identifiants invalides' 
        }, 401);
      }
      
      // Génération du token
      const token = generateToken(user.id, user.email);
      
      return c.json({
        message: 'Connexion réussie',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return c.json({ 
        error: 'Erreur lors de la connexion' 
      }, 500);
    }
  }
  
  async me(c: Context) {
    try {
      const user = c.get('user');
      
      if (!user) {
        return c.json({ 
          error: 'Utilisateur non authentifié' 
        }, 401);
      }
      
      // Récupération des données utilisateur
      const userData = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          bankConnectionId: true,
          bankAccountIds: true,
          createdAt: true,
          updatedAt: true,
          notificationSettings: true
        }
      });
      
      if (!userData) {
        return c.json({ 
          error: 'Utilisateur non trouvé' 
        }, 404);
      }
      
      return c.json({
        user: userData
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return c.json({ 
        error: 'Erreur lors de la récupération des données utilisateur' 
      }, 500);
    }
  }
}

export default new AuthController();