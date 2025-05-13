import type { Context } from 'hono';
import { prisma } from '../app';
import { addMonths, format, parseISO, startOfMonth } from 'date-fns';

// Interface pour les données d'abonnement
interface SubscriptionData {
  name: string;
  amount: number;
  category: string;
  dueDate: number;
  isShared?: boolean;
  sharingRatio?: number;
}

export class SubscriptionController {
  async getSubscriptions(c: Context) {
    try {
      const user = c.get('user');
      
      // Récupération des abonnements
      const subscriptions = await prisma.subscription.findMany({
        where: {
          userId: user.userId
        },
        orderBy: {
          dueDate: 'asc'
        }
      });
      
      return c.json({
        subscriptions
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnements:', error);
      return c.json({ 
        error: 'Impossible de récupérer les abonnements' 
      }, 500);
    }
  }
  
  async createSubscription(c: Context) {
    try {
      const user = c.get('user');
      const data = await c.req.json() as SubscriptionData;
      
      // Validation des données
      if (!data.name || data.name.trim() === '') {
        return c.json({ error: 'Nom d\'abonnement requis' }, 400);
      }
      
      if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
        return c.json({ error: 'Montant invalide' }, 400);
      }
      
      if (!data.category || data.category.trim() === '') {
        return c.json({ error: 'Catégorie requise' }, 400);
      }
      
      if (!data.dueDate || isNaN(data.dueDate) || data.dueDate < 1 || data.dueDate > 31) {
        return c.json({ error: 'Date d\'échéance invalide (1-31)' }, 400);
      }
      
      if (data.isShared && (data.sharingRatio === undefined || data.sharingRatio < 0 || data.sharingRatio > 100)) {
        return c.json({ error: 'Ratio de partage invalide (0-100)' }, 400);
      }
      
      // Création de l'abonnement
      const subscription = await prisma.subscription.create({
        data: {
          userId: user.userId,
          name: data.name,
          amount: data.amount,
          category: data.category,
          dueDate: data.dueDate,
          isShared: data.isShared || false,
          sharingRatio: data.isShared ? data.sharingRatio : null
        }
      });
      
      return c.json({
        message: 'Abonnement créé avec succès',
        subscription
      }, 201);
    } catch (error) {
      console.error('Erreur lors de la création de l\'abonnement:', error);
      return c.json({ 
        error: 'Impossible de créer l\'abonnement' 
      }, 500);
    }
  }
  
  async updateSubscription(c: Context) {
    try {
      const user = c.get('user');
      const id = c.req.param('id');
      const data = await c.req.json() as Partial<SubscriptionData>;
      
      // Vérification que l'abonnement appartient à l'utilisateur
      const subscription = await prisma.subscription.findFirst({
        where: {
          id,
          userId: user.userId
        }
      });
      
      if (!subscription) {
        return c.json({ 
          error: 'Abonnement non trouvé' 
        }, 404);
      }
      
      // Validation des données
      if (data.amount !== undefined && (isNaN(data.amount) || data.amount <= 0)) {
        return c.json({ error: 'Montant invalide' }, 400);
      }
      
      if (data.dueDate !== undefined && (isNaN(data.dueDate) || data.dueDate < 1 || data.dueDate > 31)) {
        return c.json({ error: 'Date d\'échéance invalide (1-31)' }, 400);
      }
      
      if (data.isShared && (data.sharingRatio === undefined || data.sharingRatio < 0 || data.sharingRatio > 100)) {
        return c.json({ error: 'Ratio de partage invalide (0-100)' }, 400);
      }
      
      // Mise à jour de l'abonnement
      const updatedSubscription = await prisma.subscription.update({
        where: { id },
        data: {
          name: data.name,
          amount: data.amount,
          category: data.category,
          dueDate: data.dueDate,
          isShared: data.isShared,
          sharingRatio: data.isShared ? data.sharingRatio : null
        }
      });
      
      return c.json({
        message: 'Abonnement mis à jour avec succès',
        subscription: updatedSubscription
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
      return c.json({ 
        error: 'Impossible de mettre à jour l\'abonnement' 
      }, 500);
    }
  }
  
  async deleteSubscription(c: Context) {
    try {
      const user = c.get('user');
      const id = c.req.param('id');
      
      // Vérification que l'abonnement appartient à l'utilisateur
      const subscription = await prisma.subscription.findFirst({
        where: {
          id,
          userId: user.userId
        }
      });
      
      if (!subscription) {
        return c.json({ 
          error: 'Abonnement non trouvé' 
        }, 404);
      }
      
      // Suppression de l'abonnement
      await prisma.subscription.delete({
        where: { id }
      });
      
      return c.json({
        message: 'Abonnement supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'abonnement:', error);
      return c.json({ 
        error: 'Impossible de supprimer l\'abonnement' 
      }, 500);
    }
  }
  
  async getUpcomingSubscriptions(c: Context) {
    try {
      const user = c.get('user');
      const monthsAheadStr = c.req.query('months');
      const monthsAhead = monthsAheadStr ? parseInt(monthsAheadStr, 10) : 1;
      
      // Récupération des abonnements de l'utilisateur
      const subscriptions = await prisma.subscription.findMany({
        where: {
          userId: user.userId
        }
      });
      
      // Calcul des prochaines échéances
      const today = new Date();
      const upcoming = [];
      
      for (let i = 0; i < monthsAhead; i++) {
        const targetDate = addMonths(today, i);
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();
        
        for (const subscription of subscriptions) {
          let dueDate = new Date(targetYear, targetMonth, subscription.dueDate);
          
          // Ajustement pour les mois avec moins de jours
          if (subscription.dueDate > 28) {
            const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            if (subscription.dueDate > lastDayOfMonth) {
              dueDate = new Date(targetYear, targetMonth, lastDayOfMonth);
            }
          }
          
          // N'inclure que les dates futures pour le mois en cours
          if (i === 0 && dueDate.getDate() < today.getDate()) {
            continue;
          }
          
          upcoming.push({
            ...subscription,
            nextDueDate: dueDate.toISOString(),
            formattedDueDate: format(dueDate, 'dd/MM/yyyy')
          });
        }
      }
      
      // Tri par date d'échéance
      upcoming.sort((a, b) => {
        return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
      });
      
      return c.json({
        upcomingSubscriptions: upcoming
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des prochaines échéances:', error);
      return c.json({ 
        error: 'Impossible de récupérer les prochaines échéances' 
      }, 500);
    }
  }
  
  async getMonthlySummary(c: Context) {
    try {
      const user = c.get('user');
      
      // Récupération des abonnements
      const subscriptions = await prisma.subscription.findMany({
        where: {
          userId: user.userId
        }
      });
      
      // Calcul du montant total mensuel
      let totalAmount = 0;
      let sharedAmount = 0;
      
      subscriptions.forEach(subscription => {
        totalAmount += subscription.amount;
        
        if (subscription.isShared && subscription.sharingRatio !== null) {
          // Calcul du montant partagé selon le ratio
          const effectiveAmount = subscription.amount * (subscription.sharingRatio / 100);
          sharedAmount += effectiveAmount;
        }
      });
      
      // Regroupement par catégorie
      const categories: Record<string, number> = {};
      
      subscriptions.forEach(subscription => {
        const category = subscription.category;
        categories[category] = (categories[category] || 0) + subscription.amount;
      });
      
      // Conversion des catégories en tableau
      const categoriesBreakdown = Object.entries(categories).map(([name, amount]) => ({
        name,
        amount,
        percentage: (amount / totalAmount) * 100
      })).sort((a, b) => b.amount - a.amount);
      
      return c.json({
        monthlySummary: {
          totalAmount,
          sharedAmount,
          personalAmount: totalAmount - sharedAmount,
          subscriptionCount: subscriptions.length,
          categoriesBreakdown
        }
      });
    } catch (error) {
      console.error('Erreur lors du calcul du résumé mensuel:', error);
      return c.json({ 
        error: 'Impossible de calculer le résumé mensuel' 
      }, 500);
    }
  }
}

export default new SubscriptionController();