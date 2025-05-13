import type { Context } from 'hono';
import { prisma } from '../app';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';

// Interfaces pour les objets utilisés dans les calculs
interface CategoryAmount {
  category: string;
  amount: number;
}

interface CategoryWithPercentage extends CategoryAmount {
  percentage: number;
}

interface ForecastMonth {
  month: string;
  balance: number;
  income: number;
  regularExpenses: number;
  subscriptions: number;
  cashflow: number;
}

// Interface pour les résultats de requêtes SQL brutes
interface RawQueryResult {
  [key: string]: any;
}

export class DashboardController {
  async getSummary(c: Context) {
    try {
      const user = c.get('user');
      
      // Récupération des informations bancaires
      const userInfo = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          bankAccountIds: true
        }
      });
      
      // Si aucun compte bancaire n'est connecté
      if (!userInfo || !userInfo.bankAccountIds || userInfo.bankAccountIds.length === 0) {
        return c.json({
          noBankAccount: true,
          message: 'Veuillez connecter votre compte bancaire pour voir le résumé'
        });
      }
      
      // Obtenir la date actuelle et la fin du mois
      const now = new Date();
      const startCurrentMonth = startOfMonth(now);
      const endCurrentMonth = endOfMonth(now);
      
      // Récupérer le solde total avec une requête SQL brute
      const accountBalancesRaw = await prisma.$queryRaw`
        SELECT COALESCE(SUM(amount), 0) as "totalBalance"
        FROM transactions
        WHERE "userId" = ${user.userId}
        AND "transactionDate" <= ${now}
      ` as RawQueryResult[];
      
      const totalBalance = accountBalancesRaw[0]?.totalBalance ? 
        parseFloat(accountBalancesRaw[0].totalBalance) : 0;
      
      // Récupérer le total dépensé sur le mois en cours
      const monthlyExpensesRaw = await prisma.$queryRaw`
        SELECT COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as "totalExpenses"
        FROM transactions
        WHERE "userId" = ${user.userId}
        AND "transactionDate" >= ${startCurrentMonth}
        AND "transactionDate" <= ${now}
      ` as RawQueryResult[];
      
      const totalExpensesMonth = monthlyExpensesRaw[0]?.totalExpenses ? 
        parseFloat(monthlyExpensesRaw[0].totalExpenses) : 0;
      
      // Récupérer les abonnements pour le calcul du solde prévisionnel
      const subscriptions = await prisma.subscription.findMany({
        where: {
          userId: user.userId
        }
      });
      
      // Calculer le montant total des abonnements
      let totalSubscriptions = 0;
      subscriptions.forEach((sub) => {
        // Si l'abonnement est partagé, n'ajouter que le pourcentage correspondant
        if (sub.isShared && sub.sharingRatio !== null) {
          totalSubscriptions += sub.amount * (sub.sharingRatio / 100);
        } else {
          totalSubscriptions += sub.amount;
        }
      });
      
      // Calculer le solde prévisionnel de fin de mois
      const forecastBalance = totalBalance - totalSubscriptions;
      
      // Récupérer le taux d'épargne mensuel
      const savingsAccounts = await prisma.savingsAccount.findMany({
        where: {
          userId: user.userId
        }
      });
      
      // Calculer le total des contributions mensuelles aux comptes d'épargne
      let totalSavings = 0;
      savingsAccounts.forEach((account) => {
        totalSavings += account.monthlyContribution;
      });
      
      // Calculer le pourcentage d'épargne par rapport aux revenus mensuels
      const monthlyIncomesRaw = await prisma.$queryRaw`
        SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as "totalIncomes"
        FROM transactions
        WHERE "userId" = ${user.userId}
        AND "transactionDate" >= ${startCurrentMonth}
        AND "transactionDate" <= ${endCurrentMonth}
      ` as RawQueryResult[];
      
      const totalIncomesMonth = monthlyIncomesRaw[0]?.totalIncomes ? 
        parseFloat(monthlyIncomesRaw[0].totalIncomes) : 0;
      
      // Éviter la division par zéro
      const savingsPercentage = totalIncomesMonth > 0 
        ? (totalSavings / totalIncomesMonth) * 100 
        : 0;
      
      // Récupérer les 2 dernières transactions
      const latestTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.userId
        },
        orderBy: {
          transactionDate: 'desc'
        },
        take: 2
      });
      
      return c.json({
        totalBalance,
        forecastBalance,
        savingsPercentage,
        totalExpensesMonth,
        latestTransactions
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé du tableau de bord:', error);
      return c.json({ 
        error: 'Impossible de récupérer le résumé du tableau de bord' 
      }, 500);
    }
  }
  
  async getMonthlyForecast(c: Context) {
    try {
      const user = c.get('user');
      const monthsAheadStr = c.req.query('months');
      const monthsAhead = monthsAheadStr ? parseInt(monthsAheadStr, 10) : 3;
      
      // Obtenir le solde actuel avec une requête SQL brute
      const accountBalancesRaw = await prisma.$queryRaw`
        SELECT COALESCE(SUM(amount), 0) as "totalBalance"
        FROM transactions
        WHERE "userId" = ${user.userId}
      ` as RawQueryResult[];
      
      const totalBalance = accountBalancesRaw[0]?.totalBalance ? 
        parseFloat(accountBalancesRaw[0].totalBalance) : 0;
      
      // Récupérer tous les abonnements
      const subscriptions = await prisma.subscription.findMany({
        where: {
          userId: user.userId
        }
      });
      
      // Récupérer le revenu mensuel moyen (basé sur les 3 derniers mois)
      const threeMonthsAgo = addMonths(new Date(), -3);
      
      const incomeDataRaw = await prisma.$queryRaw`
        SELECT 
          COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as "totalIncome",
          COUNT(DISTINCT DATE_TRUNC('month', "transactionDate")) as "monthCount"
        FROM transactions
        WHERE "userId" = ${user.userId}
        AND "transactionDate" >= ${threeMonthsAgo}
        AND amount > 0
      ` as RawQueryResult[];
      
      // Calculer le revenu mensuel moyen
      const totalIncome = incomeDataRaw[0]?.totalIncome ? 
        parseFloat(incomeDataRaw[0].totalIncome) : 0;
      const monthCount = incomeDataRaw[0]?.monthCount ? 
        parseInt(incomeDataRaw[0].monthCount) : 1; // Éviter division par zéro
      const averageMonthlyIncome = totalIncome / monthCount;
      
      // Calculer les dépenses mensuelles moyennes (hors abonnements)
      const expenseDataRaw = await prisma.$queryRaw`
        SELECT COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as "totalExpense"
        FROM transactions
        WHERE "userId" = ${user.userId}
        AND "transactionDate" >= ${threeMonthsAgo}
        AND amount < 0
      ` as RawQueryResult[];
      
      const totalExpense = expenseDataRaw[0]?.totalExpense ? 
        parseFloat(expenseDataRaw[0].totalExpense) : 0;
      const averageMonthlyExpense = totalExpense / monthCount;
      
      // Calculer le montant total des abonnements
      let totalSubscriptionAmount = 0;
      subscriptions.forEach((sub) => {
        if (sub.isShared && sub.sharingRatio !== null) {
          totalSubscriptionAmount += sub.amount * (sub.sharingRatio / 100);
        } else {
          totalSubscriptionAmount += sub.amount;
        }
      });
      
      // Prévisions pour les prochains mois
      const forecast: ForecastMonth[] = [];
      let runningBalance = totalBalance;
      
      for (let i = 0; i < monthsAhead; i++) {
        const monthDate = addMonths(new Date(), i);
        const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        
        // Calculer le solde prévu pour ce mois
        runningBalance = runningBalance + averageMonthlyIncome - averageMonthlyExpense - totalSubscriptionAmount;
        
        forecast.push({
          month: monthName,
          balance: runningBalance,
          income: averageMonthlyIncome,
          regularExpenses: averageMonthlyExpense,
          subscriptions: totalSubscriptionAmount,
          cashflow: averageMonthlyIncome - averageMonthlyExpense - totalSubscriptionAmount
        });
      }
      
      return c.json({
        currentBalance: totalBalance,
        monthlyIncome: averageMonthlyIncome,
        monthlyExpenses: averageMonthlyExpense,
        monthlySubscriptions: totalSubscriptionAmount,
        forecast
      });
    } catch (error) {
      console.error('Erreur lors du calcul des prévisions:', error);
      return c.json({ 
        error: 'Impossible de calculer les prévisions' 
      }, 500);
    }
  }
  
  async getExpenseBreakdown(c: Context) {
    try {
      const user = c.get('user');
      const periodStr = c.req.query('period') || 'month';
      
      // Déterminer la période
      let startDate: Date;
      const now = new Date();
      
      switch (periodStr) {
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'month':
        default:
          startDate = startOfMonth(now);
          break;
      }
      
      // Récupérer les dépenses par catégorie avec une requête SQL brute
      const expensesRaw = await prisma.$queryRaw`
        SELECT 
          COALESCE(category, 'Divers') as category,
          COALESCE(ABS(SUM(amount)), 0) as amount
        FROM transactions
        WHERE "userId" = ${user.userId}
          AND amount < 0
          AND "transactionDate" >= ${startDate}
        GROUP BY category
        ORDER BY amount DESC
      ` as RawQueryResult[];
      
      // Formater les résultats
      const categoryBreakdown: CategoryAmount[] = expensesRaw.map(item => ({
        category: item.category || 'Divers',
        amount: parseFloat(item.amount) || 0
      }));
      
      // Calculer le total des dépenses
      const totalExpenses = categoryBreakdown.reduce((sum: number, item: CategoryAmount) => sum + item.amount, 0);
      
      // Ajouter le pourcentage pour chaque catégorie
      const breakdownWithPercentage: CategoryWithPercentage[] = categoryBreakdown.map(item => ({
        ...item,
        percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0
      }));
      
      return c.json({
        period: periodStr,
        totalExpenses,
        breakdown: breakdownWithPercentage
      });
    } catch (error) {
      console.error('Erreur lors du calcul de la répartition des dépenses:', error);
      return c.json({ 
        error: 'Impossible de calculer la répartition des dépenses' 
      }, 500);
    }
  }
}

export default new DashboardController();