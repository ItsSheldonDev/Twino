// src/controllers/profile.ts - Version corrigée

import type { Context } from 'hono';
import { prisma } from '../app';
import { hashPassword, verifyPassword } from '../utils/crypto';
import Config from '../config';
import { generateToken } from '../utils/jwt';
import mailjetService from '../services/external/mailjet';
import crypto from 'crypto';

export class ProfileController {
  async getProfile(c: Context) {
    try {
      const user = c.get('user');
      
      const userProfile = await prisma.user.findUnique({
        where: { id: user.userId }
      });
      
      if (!userProfile) {
        return c.json({ error: 'Utilisateur non trouvé' }, 404);
      }
      
      const profile = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
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
      
      const newPasswordHash = await hashPassword(newPassword);
      
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
  
  async forgotPassword(c: Context) {
    try {
      const { email } = await c.req.json();
      
      if (!email) {
        return c.json({ error: 'Email requis' }, 400);
      }
      
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true }
      });
      
      if (!user) {
        return c.json({
          message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation'
        });
      }
      
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: resetToken as any,
          resetTokenExpires: new Date(Date.now() + Config.PASSWORD_RESET_EXPIRY) as any
        }
      });
      
      const resetUrl = `${Config.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
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
      
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token as any,
          resetTokenExpires: {
            gt: new Date() 
          } as any
        }
      });
      
      if (!user) {
        return c.json({ 
          error: 'Token de réinitialisation invalide ou expiré' 
        }, 400);
      }
      
      const passwordHash = await hashPassword(newPassword);
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null as any,
          resetTokenExpires: null as any
        }
      });
      
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
  
  async changeEmail(c: Context) {
    try {
      const user = c.get('user');
      const { newEmail, password } = await c.req.json();
      
      if (!newEmail || !password) {
        return c.json({ 
          error: 'Nouvel email et mot de passe requis' 
        }, 400);
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return c.json({ error: 'Format d\'email invalide' }, 400);
      }
      
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail }
      });
      
      if (existingUser) {
        return c.json({ error: 'Cet email est déjà utilisé' }, 409);
      }
      
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
      
      const updatedUser = await prisma.user.update({
        where: { id: user.userId },
        data: { email: newEmail },
        select: {
          id: true,
          email: true,
          name: true
        }
      });
      
      await mailjetService.sendEmailChangeNotification(
        oldEmail,
        newEmail,
        userInfo.name
      );
      
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
  
  async updateProfilePhoto(c: Context) {
    try {
      const user = c.get('user');
      
      const file = await c.req.parseBody();
      const profilePhoto = file.photo;
      
      if (!profilePhoto || typeof profilePhoto === 'string') {
        return c.json({ error: 'Photo de profil requise' }, 400);
      }
      
      if (profilePhoto instanceof File) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
        if (!allowedTypes.includes(profilePhoto.type)) {
          return c.json({ 
            error: 'Format de fichier non pris en charge. Utilisez JPG, PNG ou GIF' 
          }, 400);
        }
        
        if (profilePhoto.size > Config.PROFILE_PHOTO_MAX_SIZE) {
          return c.json({ 
            error: 'La taille du fichier doit être inférieure à 5 MB' 
          }, 400);
        }
        
        const photoBuffer = await profilePhoto.arrayBuffer();
        
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