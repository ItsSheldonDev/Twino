// src/controllers/profile.ts - Version corrigée

import type { Context } from 'hono';
import { prisma } from '../app';
import { hashPassword, verifyPassword } from '../utils/crypto';
import Config from '../config';
import { generateToken } from '../utils/jwt';
import mailjetService from '../services/external/mailjet';
import crypto from 'crypto';

export class ProfileController {
  /**
   * Récupère le profil de l'utilisateur connecté
   */
  async getProfile(c: Context) {
    try {
      const user = c.get('user');
      
      const userProfile = await prisma.user.findUnique({
        where: { id: user.userId }
      });
      
      if (!userProfile) {
        return c.json({ error: 'Utilisateur non trouvé' }, 404);
      }
      
      // Formater les données du profil pour la réponse
      const profile = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
        // Convertir la photo de profil en base64 si elle existe
        profilePhoto: userProfile.profilePhoto 
          ? `data:image/jpeg;base64,${Buffer.from(userProfile.profilePhoto).toString('base64')}` 
          : null
      };
      
      return c.json({ profile });
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return c.json({ error: 'Impossible de récupérer le profil' }, 500);
    }
  }
  
  /**
   * Met à jour le nom de l'utilisateur
   */
  async updateName(c: Context) {
    try {
      const user = c.get('user');
      const { name } = await c.req.json();
      
      if (!name || name.trim() === '') {
        return c.json({ error: 'Le nom est requis' }, 400);
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: user.userId },
        data: { name: name.trim() },
        select: {
          id: true,
          email: true,
          name: true
        }
      });
      
      return c.json({
        message: 'Nom mis à jour avec succès',
        user: updatedUser
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du nom:', error);
      return c.json({ error: 'Impossible de mettre à jour le nom' }, 500);
    }
  }
  
  /**
   * Change le mot de passe de l'utilisateur
   */
  async changePassword(c: Context) {
    try {
      const user = c.get('user');
      const { currentPassword, newPassword } = await c.req.json();
      
      if (!currentPassword || !newPassword) {
        return c.json({ 
          error: 'Le mot de passe actuel et le nouveau mot de passe sont requis' 
        }, 400);
      }
      
      if (newPassword.length < 8) {
        return c.json({ 
          error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' 
        }, 400);
      }
      
      // Vérifier le mot de passe actuel
      const userInfo = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { passwordHash: true }
      });
      
      if (!userInfo) {
        return c.json({ error: 'Utilisateur non trouvé' }, 404);
      }
      
      const isPasswordValid = await verifyPassword(userInfo.passwordHash, currentPassword);
      
      if (!isPasswordValid) {
        return c.json({ error: 'Mot de passe actuel incorrect' }, 401);
      }
      
      // Hasher le nouveau mot de passe
      const newPasswordHash = await hashPassword(newPassword);
      
      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: user.userId },
        data: { passwordHash: newPasswordHash }
      });
      
      return c.json({
        message: 'Mot de passe modifié avec succès'
      });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      return c.json({ error: 'Impossible de changer le mot de passe' }, 500);
    }
  }
  
  /**
   * Initie le processus de réinitialisation de mot de passe
   */
  async forgotPassword(c: Context) {
    try {
      const { email } = await c.req.json();
      
      if (!email) {
        return c.json({ error: 'Email requis' }, 400);
      }
      
      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true }
      });
      
      // Pour des raisons de sécurité, ne pas révéler si l'email existe ou non
      if (!user) {
        return c.json({
          message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation'
        });
      }
      
      // Générer un token aléatoire
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Stocker le token avec une date d'expiration (24h)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          // Utilisez une assertion de type si nécessaire
          resetToken: resetToken as any,
          resetTokenExpires: new Date(Date.now() + Config.PASSWORD_RESET_EXPIRY) as any
        }
      });
      
      // Construire l'URL de réinitialisation
      const resetUrl = `${Config.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      // Envoyer l'email de réinitialisation
      const emailSent = await mailjetService.sendPasswordResetEmail(email, resetUrl, user.name);
      
      if (!emailSent) {
        return c.json({ 
          error: 'Erreur lors de l\'envoi de l\'email de réinitialisation' 
        }, 500);
      }
      
      return c.json({
        message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation'
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la réinitialisation de mot de passe:', error);
      return c.json({ 
        error: 'Erreur lors de l\'initialisation de la réinitialisation de mot de passe' 
      }, 500);
    }
  }
  
  /**
   * Réinitialise le mot de passe avec un token
   */
  async resetPassword(c: Context) {
    try {
      const { token, newPassword } = await c.req.json();
      
      if (!token || !newPassword) {
        return c.json({ error: 'Token et nouveau mot de passe requis' }, 400);
      }
      
      if (newPassword.length < 8) {
        return c.json({ 
          error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' 
        }, 400);
      }
      
      // Vérifier si le token est valide et non expiré
      const user = await prisma.user.findFirst({
        where: {
          // Utilisez une assertion de type si nécessaire
          resetToken: token as any,
          resetTokenExpires: {
            gt: new Date() // Token non expiré
          } as any
        }
      });
      
      if (!user) {
        return c.json({ 
          error: 'Token de réinitialisation invalide ou expiré' 
        }, 400);
      }
      
      // Hasher le nouveau mot de passe
      const passwordHash = await hashPassword(newPassword);
      
      // Mettre à jour le mot de passe et supprimer le token de réinitialisation
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null as any,
          resetTokenExpires: null as any
        }
      });
      
      // Générer un nouveau token JWT
      const authToken = generateToken(user.id, user.email);
      
      return c.json({
        message: 'Mot de passe réinitialisé avec succès',
        token: authToken
      });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      return c.json({ 
        error: 'Erreur lors de la réinitialisation du mot de passe' 
      }, 500);
    }
  }
  
  /**
   * Change l'email de l'utilisateur
   */
  async changeEmail(c: Context) {
    try {
      const user = c.get('user');
      const { newEmail, password } = await c.req.json();
      
      if (!newEmail || !password) {
        return c.json({ 
          error: 'Nouvel email et mot de passe requis' 
        }, 400);
      }
      
      // Vérifier le format de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return c.json({ error: 'Format d\'email invalide' }, 400);
      }
      
      // Vérifier si l'email est déjà utilisé
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail }
      });
      
      if (existingUser) {
        return c.json({ error: 'Cet email est déjà utilisé' }, 409);
      }
      
      // Vérifier le mot de passe actuel
      const userInfo = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { passwordHash: true, email: true, name: true }
      });
      
      if (!userInfo) {
        return c.json({ error: 'Utilisateur non trouvé' }, 404);
      }
      
      const isPasswordValid = await verifyPassword(userInfo.passwordHash, password);
      
      if (!isPasswordValid) {
        return c.json({ error: 'Mot de passe incorrect' }, 401);
      }
      
      const oldEmail = userInfo.email;
      
      // Mettre à jour l'email
      const updatedUser = await prisma.user.update({
        where: { id: user.userId },
        data: { email: newEmail },
        select: {
          id: true,
          email: true,
          name: true
        }
      });
      
      // Envoyer une notification de changement d'email
      await mailjetService.sendEmailChangeNotification(
        oldEmail,
        newEmail,
        userInfo.name
      );
      
      // Générer un nouveau token avec le nouvel email
      const token = generateToken(updatedUser.id, updatedUser.email);
      
      return c.json({
        message: 'Email modifié avec succès',
        user: updatedUser,
        token
      });
    } catch (error) {
      console.error('Erreur lors du changement d\'email:', error);
      return c.json({ error: 'Impossible de changer l\'email' }, 500);
    }
  }
  
  /**
   * Met à jour la photo de profil
   */
  async updateProfilePhoto(c: Context) {
    try {
      const user = c.get('user');
      
      // Obtenir le fichier de la requête multipart
      const file = await c.req.parseBody();
      const profilePhoto = file.photo;
      
      if (!profilePhoto || typeof profilePhoto === 'string') {
        return c.json({ error: 'Photo de profil requise' }, 400);
      }
      
      // Vérifier le type de fichier
      if (profilePhoto instanceof File) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
        if (!allowedTypes.includes(profilePhoto.type)) {
          return c.json({ 
            error: 'Format de fichier non pris en charge. Utilisez JPG, PNG ou GIF' 
          }, 400);
        }
        
        // Vérifier la taille du fichier (5 MB max)
        if (profilePhoto.size > Config.PROFILE_PHOTO_MAX_SIZE) {
          return c.json({ 
            error: 'La taille du fichier doit être inférieure à 5 MB' 
          }, 400);
        }
        
        // Lire le contenu du fichier
        const photoBuffer = await profilePhoto.arrayBuffer();
        
        // Mettre à jour la photo de profil avec une assertion de type
        await prisma.user.update({
          where: { id: user.userId },
          data: { 
            profilePhoto: Buffer.from(photoBuffer) as any
          }
        });
        
        return c.json({
          message: 'Photo de profil mise à jour avec succès'
        });
      } else {
        return c.json({ error: 'Format de fichier invalide' }, 400);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la photo de profil:', error);
      return c.json({ 
        error: 'Impossible de mettre à jour la photo de profil' 
      }, 500);
    }
  }
  
  /**
   * Supprime la photo de profil
   */
  async deleteProfilePhoto(c: Context) {
    try {
      const user = c.get('user');
      
      await prisma.user.update({
        where: { id: user.userId },
        data: { 
          profilePhoto: null as any 
        }
      });
      
      return c.json({
        message: 'Photo de profil supprimée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la photo de profil:', error);
      return c.json({ 
        error: 'Impossible de supprimer la photo de profil' 
      }, 500);
    }
  }
}

export default new ProfileController();