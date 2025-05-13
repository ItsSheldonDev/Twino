import type { Context } from 'hono';
import { prisma } from '../app';
import type { SavingsAccount, SavingsGoal } from '@prisma/client';

// Interface pour les données de compte d'épargne
interface SavingsAccountData {
  type: string;
  name: string;
  balance?: number;
  monthlyContribution: number;
  interestRate?: number;
}

// Interface pour les données d'objectif d'épargne
interface SavingsGoalData {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string;
  isShared?: boolean;
}

export class SavingsController {
  async getSavingsAccounts(c: Context) {
    try {
      const user = c.get('user');
      
      // Récupération des comptes d'épargne
      const accounts = await prisma.savingsAccount.findMany({
        where: {
          userId: user.userId
        }
      });
      
      return c.json({
        accounts
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des comptes d\'épargne:', error);
      return c.json({ 
        error: 'Impossible de récupérer les comptes d\'épargne' 
      }, 500);
    }
  }
  
  async createSavingsAccount(c: Context) {
    try {
      const user = c.get('user');
      const data = await c.req.json() as SavingsAccountData;
      
      // Validation des données
      if (!data.type || data.type.trim() === '') {
        return c.json({ error: 'Type de compte requis' }, 400);
      }
      
      if (!data.name || data.name.trim() === '') {
        return c.json({ error: 'Nom de compte requis' }, 400);
      }
      
      if (data.monthlyContribution === undefined || isNaN(data.monthlyContribution) || data.monthlyContribution < 0) {
        return c.json({ error: 'Contribution mensuelle invalide' }, 400);
      }
      
      if (data.interestRate !== undefined && (isNaN(data.interestRate) || data.interestRate < 0)) {
        return c.json({ error: 'Taux d\'intérêt invalide' }, 400);
      }
      
      // Création du compte d'épargne
      const account = await prisma.savingsAccount.create({
        data: {
          userId: user.userId,
          type: data.type,
          name: data.name,
          balance: data.balance || 0,
          monthlyContribution: data.monthlyContribution,
          interestRate: data.interestRate
        }
      });
      
      return c.json({
        message: 'Compte d\'épargne créé avec succès',
        account
      }, 201);
    } catch (error) {
      console.error('Erreur lors de la création du compte d\'épargne:', error);
      return c.json({ 
        error: 'Impossible de créer le compte d\'épargne' 
      }, 500);
    }
  }
  
  async updateSavingsAccount(c: Context) {
    try {
      const user = c.get('user');
      const id = c.req.param('id');
      const data = await c.req.json() as Partial<SavingsAccountData>;
      
      // Vérification que le compte appartient à l'utilisateur
      const account = await prisma.savingsAccount.findFirst({
        where: {
          id,
          userId: user.userId
        }
      });
      
      if (!account) {
        return c.json({ 
          error: 'Compte d\'épargne non trouvé' 
        }, 404);
      }
      
      // Validation des données
      if (data.monthlyContribution !== undefined && (isNaN(data.monthlyContribution) || data.monthlyContribution < 0)) {
        return c.json({ error: 'Contribution mensuelle invalide' }, 400);
      }
      
      if (data.interestRate !== undefined && (isNaN(data.interestRate) || data.interestRate < 0)) {
        return c.json({ error: 'Taux d\'intérêt invalide' }, 400);
      }
      
      // Mise à jour du compte d'épargne
      const updatedAccount = await prisma.savingsAccount.update({
        where: { id },
        data: {
          type: data.type,
          name: data.name,
          balance: data.balance,
          monthlyContribution: data.monthlyContribution,
          interestRate: data.interestRate
        }
      });
      
      return c.json({
        message: 'Compte d\'épargne mis à jour avec succès',
        account: updatedAccount
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compte d\'épargne:', error);
      return c.json({ 
        error: 'Impossible de mettre à jour le compte d\'épargne' 
      }, 500);
    }
  }
  
  async deleteSavingsAccount(c: Context) {
    try {
      const user = c.get('user');
      const id = c.req.param('id');
      
      // Vérification que le compte appartient à l'utilisateur
      const account = await prisma.savingsAccount.findFirst({
        where: {
          id,
          userId: user.userId
        }
      });
      
      if (!account) {
        return c.json({ 
          error: 'Compte d\'épargne non trouvé' 
        }, 404);
      }
      
      // Suppression du compte d'épargne
      await prisma.savingsAccount.delete({
        where: { id }
      });
      
      return c.json({
        message: 'Compte d\'épargne supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du compte d\'épargne:', error);
      return c.json({ 
        error: 'Impossible de supprimer le compte d\'épargne' 
      }, 500);
    }
  }
  
  async getSavingsGoals(c: Context) {
    try {
      const user = c.get('user');
      
      // Récupération des objectifs d'épargne
      const goals = await prisma.savingsGoal.findMany({
        where: {
          userId: user.userId
        }
      });
      
      return c.json({
        goals
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des objectifs d\'épargne:', error);
      return c.json({ 
        error: 'Impossible de récupérer les objectifs d\'épargne' 
      }, 500);
    }
  }
  
  async createSavingsGoal(c: Context) {
    try {
      const user = c.get('user');
      const data = await c.req.json() as SavingsGoalData;
      
      // Validation des données
      if (!data.name || data.name.trim() === '') {
        return c.json({ error: 'Nom d\'objectif requis' }, 400);
      }
      
      if (!data.targetAmount || isNaN(data.targetAmount) || data.targetAmount <= 0) {
        return c.json({ error: 'Montant cible invalide' }, 400);
      }
      
      // Création de l'objectif d'épargne
      const goal = await prisma.savingsGoal.create({
        data: {
          userId: user.userId,
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount || 0,
          deadline: data.deadline ? new Date(data.deadline) : null,
          isShared: data.isShared || false
        }
      });
      
      return c.json({
        message: 'Objectif d\'épargne créé avec succès',
        goal
      }, 201);
    } catch (error) {
      console.error('Erreur lors de la création de l\'objectif d\'épargne:', error);
      return c.json({ 
        error: 'Impossible de créer l\'objectif d\'épargne' 
      }, 500);
    }
  }
  
  async updateSavingsGoal(c: Context) {
    try {
      const user = c.get('user');
      const id = c.req.param('id');
      const data = await c.req.json() as Partial<SavingsGoalData>;
      
      // Vérification que l'objectif appartient à l'utilisateur
      const goal = await prisma.savingsGoal.findFirst({
        where: {
          id,
          userId: user.userId
        }
      });
      
      if (!goal) {
        return c.json({ 
          error: 'Objectif d\'épargne non trouvé' 
        }, 404);
      }
      
      // Validation des données
      if (data.targetAmount !== undefined && (isNaN(data.targetAmount) || data.targetAmount <= 0)) {
        return c.json({ error: 'Montant cible invalide' }, 400);
      }
      
      if (data.currentAmount !== undefined && (isNaN(data.currentAmount) || data.currentAmount < 0)) {
        return c.json({ error: 'Montant actuel invalide' }, 400);
      }
      
      // Mise à jour de l'objectif d'épargne
      const updatedGoal = await prisma.savingsGoal.update({
        where: { id },
        data: {
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount,
          deadline: data.deadline ? new Date(data.deadline) : goal.deadline,
          isShared: data.isShared
        }
      });
      
      return c.json({
        message: 'Objectif d\'épargne mis à jour avec succès',
        goal: updatedGoal
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'objectif d\'épargne:', error);
      return c.json({ 
        error: 'Impossible de mettre à jour l\'objectif d\'épargne' 
      }, 500);
    }
  }
  
  async deleteSavingsGoal(c: Context) {
    try {
      const user = c.get('user');
      const id = c.req.param('id');
      
      // Vérification que l'objectif appartient à l'utilisateur
      const goal = await prisma.savingsGoal.findFirst({
        where: {
          id,
          userId: user.userId
        }
      });
      
      if (!goal) {
        return c.json({ 
          error: 'Objectif d\'épargne non trouvé' 
        }, 404);
      }
      
      // Suppression de l'objectif d'épargne
      await prisma.savingsGoal.delete({
        where: { id }
      });
      
      return c.json({
        message: 'Objectif d\'épargne supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'objectif d\'épargne:', error);
      return c.json({ 
        error: 'Impossible de supprimer l\'objectif d\'épargne' 
      }, 500);
    }
  }
  
  async getSavingsSummary(c: Context) {
    try {
      const user = c.get('user');
      
      // Récupération des comptes d'épargne
      const accounts = await prisma.savingsAccount.findMany({
        where: {
          userId: user.userId
        }
      });
      
      // Récupération des objectifs d'épargne
      const goals = await prisma.savingsGoal.findMany({
        where: {
          userId: user.userId
        }
      });
      
      // Calcul du total des comptes d'épargne
      const totalSavingsBalance = accounts.reduce((sum: number, account: SavingsAccount) => sum + account.balance, 0);
      
      // Calcul du total des contributions mensuelles
      const monthlyContributions = accounts.reduce((sum: number, account: SavingsAccount) => sum + account.monthlyContribution, 0);
      
      // Calcul du total des objectifs d'épargne
      const totalGoalsTarget = goals.reduce((sum: number, goal: SavingsGoal) => sum + goal.targetAmount, 0);
      const totalGoalsCurrent = goals.reduce((sum: number, goal: SavingsGoal) => sum + goal.currentAmount, 0);
      const totalGoalsRemaining = totalGoalsTarget - totalGoalsCurrent;
      
      // Calcul du temps estimé pour atteindre tous les objectifs
      const monthsToGoals = monthlyContributions > 0 ? Math.ceil(totalGoalsRemaining / monthlyContributions) : null;
      
      return c.json({
        summary: {
          totalSavingsBalance,
          monthlyContributions,
          accountCount: accounts.length,
          goalCount: goals.length,
          totalGoalsTarget,
          totalGoalsCurrent,
          totalGoalsRemaining,
          goalProgress: totalGoalsTarget > 0 ? (totalGoalsCurrent / totalGoalsTarget) * 100 : 0,
          monthsToGoals
        },
        accounts,
        goals
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé d\'épargne:', error);
      return c.json({ 
        error: 'Impossible de récupérer le résumé d\'épargne' 
      }, 500);
    }
  }
}

export default new SavingsController();