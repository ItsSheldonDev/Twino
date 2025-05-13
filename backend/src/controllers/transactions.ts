import type { Context } from 'hono';
import { prisma } from '../app';

// Définition des interfaces pour éviter les types 'any'
interface CategoryCount {
  category: string | null;
  _count: {
    category: number;
  }
}

interface CategorySummary {
  name: string;
  count: number;
}

export class TransactionController {
  async getTransactions(c: Context) {
    try {
      const user = c.get('user');
      
      // Paramètres de pagination et filtrage
      const pageQuery = c.req.query('page');
      const limitQuery = c.req.query('limit');
      const page = pageQuery ? parseInt(pageQuery, 10) : 1;
      const limit = limitQuery ? parseInt(limitQuery, 10) : 20;
      const skip = (page - 1) * limit;
      
      // Filtres
      const category = c.req.query('category');
      const startDate = c.req.query('startDate');
      const endDate = c.req.query('endDate');
      const minAmountStr = c.req.query('minAmount');
      const maxAmountStr = c.req.query('maxAmount');
      const minAmount = minAmountStr ? parseFloat(minAmountStr) : 0;
      const maxAmount = maxAmountStr ? parseFloat(maxAmountStr) : undefined;
      const isSharedStr = c.req.query('isShared');
      const isShared = isSharedStr === 'true' ? true : 
                       isSharedStr === 'false' ? false : undefined;
      
      // Construction du filtre
      const filter: any = {
        userId: user.userId
      };
      
      if (category) {
        filter.category = category;
      }
      
      if (startDate || endDate) {
        filter.transactionDate = {};
        
        if (startDate) {
          filter.transactionDate.gte = new Date(startDate);
        }
        
        if (endDate) {
          filter.transactionDate.lte = new Date(endDate);
        }
      }
      
      if (minAmount || maxAmount) {
        filter.amount = {};
        
        if (minAmount) {
          filter.amount.gte = minAmount;
        }
        
        if (maxAmount) {
          filter.amount.lte = maxAmount;
        }
      }
      
      if (isShared !== undefined) {
        filter.isShared = isShared;
      }
      
      // Récupération des transactions
      const transactions = await prisma.transaction.findMany({
        where: filter,
        orderBy: {
          transactionDate: 'desc'
        },
        skip,
        take: limit
      });
      
      // Comptage du total pour la pagination
      const total = await prisma.transaction.count({
        where: filter
      });
      
      return c.json({
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      return c.json({ 
        error: 'Impossible de récupérer les transactions' 
      }, 500);
    }
  }
  
  async getLatestTransactions(c: Context) {
    try {
      const user = c.get('user');
      const limitQuery = c.req.query('limit');
      const limit = limitQuery ? parseInt(limitQuery, 10) : 5;
      
      // Récupération des dernières transactions
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: user.userId
        },
        orderBy: {
          transactionDate: 'desc'
        },
        take: limit
      });
      
      return c.json({
        transactions
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des dernières transactions:', error);
      return c.json({ 
        error: 'Impossible de récupérer les dernières transactions' 
      }, 500);
    }
  }
  
  async updateTransaction(c: Context) {
    try {
      const user = c.get('user');
      const id = c.req.param('id');
      const data = await c.req.json();
      
      // Validation des données
      if (data.amount !== undefined && (isNaN(data.amount) || data.amount === '')) {
        return c.json({ 
          error: 'Montant invalide' 
        }, 400);
      }
      
      if (data.sharingRatio !== undefined && 
          (isNaN(data.sharingRatio) || data.sharingRatio < 0 || data.sharingRatio > 100)) {
        return c.json({ 
          error: 'Ratio de partage invalide (doit être entre 0 et 100)' 
        }, 400);
      }
      
      // Vérification que la transaction appartient à l'utilisateur
      const transaction = await prisma.transaction.findFirst({
        where: {
          id,
          userId: user.userId
        }
      });
      
      if (!transaction) {
        return c.json({ 
          error: 'Transaction non trouvée' 
        }, 404);
      }
      
      // Mise à jour de la transaction
      const updatedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          category: data.category,
          description: data.description,
          isShared: data.isShared,
          sharingRatio: data.isShared ? data.sharingRatio : null
        }
      });
      
      return c.json({
        message: 'Transaction mise à jour avec succès',
        transaction: updatedTransaction
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la transaction:', error);
      return c.json({ 
        error: 'Impossible de mettre à jour la transaction' 
      }, 500);
    }
  }
  
  async getTransactionCategories(c: Context) {
    try {
      const user = c.get('user');
      
      // Récupérer toutes les catégories utilisées
      // Nous devons typer correctement le résultat de l'opération groupBy
      const categoriesResult = await prisma.$queryRaw`
        SELECT category, COUNT(category) as count
        FROM transactions
        WHERE "userId" = ${user.userId} AND category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
      `;
      
      // Formatage du résultat
      const categories: CategorySummary[] = [];
      
      // Transformation du résultat brut en format attendu
      for (const row of categoriesResult as any[]) {
        if (row.category) {
          categories.push({
            name: row.category,
            count: parseInt(row.count)
          });
        }
      }
      
      return c.json({
        categories
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      return c.json({ 
        error: 'Impossible de récupérer les catégories' 
      }, 500);
    }
  }
  
  async getMonthlyStats(c: Context) {
    try {
      const user = c.get('user');
      const yearQuery = c.req.query('year');
      const monthQuery = c.req.query('month');
      
      const year = yearQuery 
        ? parseInt(yearQuery, 10) 
        : new Date().getFullYear();
        
      const month = monthQuery 
        ? parseInt(monthQuery, 10) - 1 
        : null; // -1 car les mois JavaScript commencent à 0
      
      // Définition de la période
      let startDate, endDate;
      
      if (month !== null) {
        // Statistiques pour un mois spécifique
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0); // Dernier jour du mois
      } else {
        // Statistiques pour l'année entière
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 12, 0); // Dernier jour de l'année
      }
      
      // Récupération des transactions de la période
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: user.userId,
          transactionDate: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      // Calcul des statistiques
      let totalIncome = 0;
      let totalExpense = 0;
      
      // Catégories de dépenses
      const categories: Record<string, number> = {};
      
      transactions.forEach((transaction: any) => {
        if (transaction.amount > 0) {
          totalIncome += transaction.amount;
        } else {
          totalExpense += Math.abs(transaction.amount);
          
          // Ajout à la catégorie
          const category = transaction.category || 'Divers';
          categories[category] = (categories[category] || 0) + Math.abs(transaction.amount);
        }
      });
      
      // Conversion des catégories en tableau pour le tri
      const categoriesArray = Object.entries(categories).map(([name, amount]) => ({
        name,
        amount
      })).sort((a, b) => b.amount - a.amount);
      
      return c.json({
        period: {
          year,
          month: month !== null ? month + 1 : null,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        stats: {
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          categories: categoriesArray
        }
      });
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques mensuelles:', error);
      return c.json({ 
        error: 'Impossible de calculer les statistiques' 
      }, 500);
    }
  }
}

export default new TransactionController();