import type { Context } from 'hono';
import { prisma } from '../app';

interface SharedExpenseData {
  description: string;
  amount: number;
  category?: string;
  date: string;
  partnerId: string;
  splitRatio: number;
}

interface SharedExpense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string | null;
  date: Date;
  userId: string;
  partnerId: string;
  splitRatio: number;
  isSettled: boolean;
  settledDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface BalanceSummary {
  userId: string;
  userName: string;
  owes: number;
  isOwed: number;
  netBalance: number;
}

export class SharedController {
  async getSharedExpenses(c: Context) {
    try {
      const user = c.get('user');
      const statusFilter = c.req.query('status'); // 'settled', 'pending', 'all'
      
      // Construction du filtre
      const filter: any = {
        OR: [
          { userId: user.userId },
          { partnerId: user.userId }
        ]
      };
      
      if (statusFilter === 'settled') {
        filter.isSettled = true;
      } else if (statusFilter === 'pending') {
        filter.isSettled = false;
      }
      
      // Récupération des dépenses partagées
      const sharedExpenses = await prisma.sharedExpense.findMany({
        where: filter,
        orderBy: {
          date: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          },
          partner: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      return c.json({
        sharedExpenses
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des dépenses partagées:', error);
      return c.json({ 
        error: 'Impossible de récupérer les dépenses partagées' 
      }, 500);
    }
  }
  
  async createSharedExpense(c: Context) {
    try {
      const user = c.get('user');
      const data = await c.req.json() as SharedExpenseData;
      
      // Validation des données
      if (!data.description || data.description.trim() === '') {
        return c.json({ error: 'Description requise' }, 400);
      }
      
      if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
        return c.json({ error: 'Montant invalide' }, 400);
      }
      
      if (!data.date) {
        return c.json({ error: 'Date requise' }, 400);
      }
      
      if (!data.partnerId) {
        return c.json({ error: 'ID du partenaire requis' }, 400);
      }
      
      if (data.splitRatio === undefined || isNaN(data.splitRatio) || data.splitRatio < 0 || data.splitRatio > 100) {
        return c.json({ error: 'Ratio de partage invalide (0-100)' }, 400);
      }
      
      // Vérification que le partenaire existe
      const partner = await prisma.user.findUnique({
        where: { id: data.partnerId }
      });
      
      if (!partner) {
        return c.json({ error: 'Partenaire non trouvé' }, 404);
      }
      
      // Création de la dépense partagée
      const sharedExpense = await prisma.sharedExpense.create({
        data: {
          userId: user.userId,
          partnerId: data.partnerId,
          description: data.description,
          amount: data.amount,
          category: data.category,
          date: new Date(data.date),
          splitRatio: data.splitRatio,
          isSettled: false
        }
      });
      
      return c.json({
        message: 'Dépense partagée créée avec succès',
        sharedExpense
      }, 201);
    } catch (error) {
      console.error('Erreur lors de la création de la dépense partagée:', error);
      return c.json({ 
        error: 'Impossible de créer la dépense partagée' 
      }, 500);
    }
  }
  
  async updateSharedExpense(c: Context) {
    try {
      const user = c.get('user');
      const id = c.req.param('id');
      const data = await c.req.json();
      
      // Vérification que la dépense partagée existe et appartient à l'utilisateur
      const sharedExpense = await prisma.sharedExpense.findFirst({
        where: {
          id,
          OR: [
            { userId: user.userId },
            { partnerId: user.userId }
          ]
        }
      });
      
      if (!sharedExpense) {
        return c.json({ error: 'Dépense partagée non trouvée' }, 404);
      }
      
      // Validation des données
      if (data.amount !== undefined && (isNaN(data.amount) || data.amount <= 0)) {
        return c.json({ error: 'Montant invalide' }, 400);
      }
      
      if (data.splitRatio !== undefined && (isNaN(data.splitRatio) || data.splitRatio < 0 || data.splitRatio > 100)) {
        return c.json({ error: 'Ratio de partage invalide (0-100)' }, 400);
      }
      
      // Mise à jour de la dépense partagée
      const updatedSharedExpense = await prisma.sharedExpense.update({
        where: { id },
        data: {
          description: data.description,
          amount: data.amount,
          category: data.category,
          date: data.date ? new Date(data.date) : undefined,
          splitRatio: data.splitRatio,
          isSettled: data.isSettled,
          settledDate: data.isSettled ? new Date() : null
        }
      });
      
      return c.json({
        message: 'Dépense partagée mise à jour avec succès',
        sharedExpense: updatedSharedExpense
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la dépense partagée:', error);
      return c.json({ 
        error: 'Impossible de mettre à jour la dépense partagée' 
      }, 500);
    }
  }
  
  async deleteSharedExpense(c: Context) {
    try {
      const user = c.get('user');
      const id = c.req.param('id');
      
      // Vérification que la dépense partagée existe et appartient à l'utilisateur
      const sharedExpense = await prisma.sharedExpense.findFirst({
        where: {
          id,
          OR: [
            { userId: user.userId },
            { partnerId: user.userId }
          ]
        }
      });
      
      if (!sharedExpense) {
        return c.json({ error: 'Dépense partagée non trouvée' }, 404);
      }
      
      // Suppression de la dépense partagée
      await prisma.sharedExpense.delete({
        where: { id }
      });
      
      return c.json({
        message: 'Dépense partagée supprimée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la dépense partagée:', error);
      return c.json({ 
        error: 'Impossible de supprimer la dépense partagée' 
      }, 500);
    }
  }
  
  async getBalanceSummary(c: Context) {
    try {
      const user = c.get('user');
      
      // Trouver le partenaire
      const partner = await prisma.user.findFirst({
        where: {
          id: {
            not: user.userId
          }
        },
        select: {
          id: true,
          name: true
        }
      });
      
      if (!partner) {
        return c.json({ 
          error: 'Aucun partenaire trouvé' 
        }, 404);
      }
      
      // Récupérer toutes les dépenses non réglées
      const pendingExpenses = await prisma.sharedExpense.findMany({
        where: {
          isSettled: false,
          OR: [
            {
              userId: user.userId,
              partnerId: partner.id
            },
            {
              userId: partner.id,
              partnerId: user.userId
            }
          ]
        }
      });
      
      // Calculer ce que l'utilisateur doit au partenaire
      let userOwesToPartner = 0;
      
      // Calculer ce que le partenaire doit à l'utilisateur
      let partnerOwesToUser = 0;
      
      // Calcul des montants
      pendingExpenses.forEach((expense: SharedExpense) => {
        const partnerShare = expense.amount * (1 - expense.splitRatio / 100);
        
        if (expense.userId === user.userId) {
          // Dépense payée par l'utilisateur, le partenaire lui doit sa part
          partnerOwesToUser += partnerShare;
        } else {
          // Dépense payée par le partenaire, l'utilisateur lui doit sa part
          userOwesToPartner += expense.amount * (expense.splitRatio / 100);
        }
      });
      
      // Calculer le solde net (positif si le partenaire doit à l'utilisateur)
      const netBalance = partnerOwesToUser - userOwesToPartner;
      
      // Créer les résumés de solde pour chaque personne
      const userSummary: BalanceSummary = {
        userId: user.userId,
        userName: user.email ? user.email.split('@')[0] : 'Utilisateur', // Utiliser le début de l'email comme nom si nécessaire
        owes: userOwesToPartner,
        isOwed: partnerOwesToUser,
        netBalance
      };
      
      const partnerSummary: BalanceSummary = {
        userId: partner.id,
        userName: partner.name,
        owes: partnerOwesToUser,
        isOwed: userOwesToPartner,
        netBalance: -netBalance
      };
      
      return c.json({
        summary: {
          netBalance,
          pendingTransactionsCount: pendingExpenses.length,
          userSummary,
          partnerSummary
        },
        whoShouldPay: netBalance > 0 
          ? { userId: partnerSummary.userId, name: partnerSummary.userName, amount: Math.abs(netBalance) }
          : { userId: userSummary.userId, name: userSummary.userName, amount: Math.abs(netBalance) }
      });
    } catch (error) {
      console.error('Erreur lors du calcul du résumé des soldes:', error);
      return c.json({ 
        error: 'Impossible de calculer le résumé des soldes' 
      }, 500);
    }
  }
  
  async settleUpBalance(c: Context) {
    try {
      const user = c.get('user');
      const { partnerId } = await c.req.json();
      
      if (!partnerId) {
        return c.json({ error: 'ID du partenaire requis' }, 400);
      }
      
      // Vérifier que le partenaire existe
      const partner = await prisma.user.findUnique({
        where: { id: partnerId }
      });
      
      if (!partner) {
        return c.json({ error: 'Partenaire non trouvé' }, 404);
      }
      
      // Récupérer toutes les dépenses non réglées entre les deux utilisateurs
      const pendingExpenses = await prisma.sharedExpense.findMany({
        where: {
          isSettled: false,
          OR: [
            {
              userId: user.userId,
              partnerId
            },
            {
              userId: partnerId,
              partnerId: user.userId
            }
          ]
        }
      });
      
      // Marquer toutes les dépenses comme réglées
      await prisma.$transaction(
        pendingExpenses.map((expense) => 
          prisma.sharedExpense.update({
            where: { id: expense.id },
            data: {
              isSettled: true,
              settledDate: new Date()
            }
          })
        )
      );
      
      return c.json({
        message: 'Toutes les dépenses ont été réglées',
        settledCount: pendingExpenses.length
      });
    } catch (error) {
      console.error('Erreur lors du règlement des dépenses:', error);
      return c.json({ 
        error: 'Impossible de régler les dépenses' 
      }, 500);
    }
  }
}

export default new SharedController();