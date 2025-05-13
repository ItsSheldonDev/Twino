import type { Context } from 'hono';
import { prisma } from '../app';
import { addDays, isBefore } from 'date-fns';

interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  category: string;
  dueDate: number;
  isShared: boolean;
  sharingRatio: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationSettingsData {
  budgetAlerts: boolean;
  paymentReminders: boolean;
  reminderDays: number;
  largeTransactionAlerts: boolean;
  largeTransactionAmount: number;
  weeklyReports: boolean;
}

interface CategoryExpenseData {
  category: string;
  total: number;
  count: number;
}

interface Transaction {
  id: string;
  externalId: string;
  userId: string;
  amount: number;
  currency: string;
  description: string;
  category: string | null;
  transactionDate: Date;
  bookingDate: Date | null;
  valueDate: Date | null;
  isShared: boolean;
  sharingRatio: number | null;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Alert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
  date?: string;
  dueDate?: string;
  data?: any;
}

export class NotificationController {
  async getSettings(c: Context) {
    try {
      const user = c.get('user');
      
      const settings = await prisma.notificationSetting.findUnique({
        where: {
          userId: user.userId
        }
      });
      
      if (!settings) {
        const defaultSettings = await prisma.notificationSetting.create({
          data: {
            userId: user.userId,
            budgetAlerts: true,
            paymentReminders: true,
            reminderDays: 3,
            largeTransactionAlerts: true,
            largeTransactionAmount: 100,
            weeklyReports: true
          }
        });
        
        return c.json({
          settings: defaultSettings
        });
      }
      
      return c.json({
        settings
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres de notification:', error);
      return c.json({ 
        error: 'Impossible de récupérer les paramètres de notification' 
      }, 500);
    }
  }
  
  async updateSettings(c: Context) {
    try {
      const user = c.get('user');
      const data = await c.req.json() as NotificationSettingsData;
      
      const settings = await prisma.notificationSetting.upsert({
        where: {
          userId: user.userId
        },
        update: {
          budgetAlerts: data.budgetAlerts !== undefined ? data.budgetAlerts : undefined,
          paymentReminders: data.paymentReminders !== undefined ? data.paymentReminders : undefined,
          reminderDays: data.reminderDays !== undefined ? data.reminderDays : undefined,
          largeTransactionAlerts: data.largeTransactionAlerts !== undefined ? data.largeTransactionAlerts : undefined,
          largeTransactionAmount: data.largeTransactionAmount !== undefined ? data.largeTransactionAmount : undefined,
          weeklyReports: data.weeklyReports !== undefined ? data.weeklyReports : undefined
        },
        create: {
          userId: user.userId,
          budgetAlerts: data.budgetAlerts !== undefined ? data.budgetAlerts : true,
          paymentReminders: data.paymentReminders !== undefined ? data.paymentReminders : true,
          reminderDays: data.reminderDays !== undefined ? data.reminderDays : 3,
          largeTransactionAlerts: data.largeTransactionAlerts !== undefined ? data.largeTransactionAlerts : true,
          largeTransactionAmount: data.largeTransactionAmount !== undefined ? data.largeTransactionAmount : 100,
          weeklyReports: data.weeklyReports !== undefined ? data.weeklyReports : true
        }
      });
      
      return c.json({
        message: 'Paramètres de notification mis à jour avec succès',
        settings
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres de notification:', error);
      return c.json({ 
        error: 'Impossible de mettre à jour les paramètres de notification' 
      }, 500);
    }
  }
  
  async getActiveAlerts(c: Context) {
    try {
      const user = c.get('user');
      
      const settings = await prisma.notificationSetting.findUnique({
        where: {
          userId: user.userId
        }
      });
      
      if (!settings) {
        return c.json({
          alerts: []
        });
      }
      
      const alerts: Alert[] = [];
      
      if (settings.paymentReminders) {
        const subscriptions = await prisma.subscription.findMany({
          where: {
            userId: user.userId
          }
        });
        
        const today = new Date();
        const reminderDate = addDays(today, settings.reminderDays);
        
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        subscriptions.forEach((subscription: Subscription) => {
          let dueDate = new Date(currentYear, currentMonth, subscription.dueDate);
          
          if (isBefore(dueDate, today)) {
            dueDate = new Date(currentYear, currentMonth + 1, subscription.dueDate);
          }
          
          if (isBefore(dueDate, reminderDate)) {
            alerts.push({
              type: 'payment_reminder',
              message: `Le paiement "${subscription.name}" de ${subscription.amount} € est prévu le ${dueDate.toLocaleDateString('fr-FR')}`,
              severity: 'warning',
              dueDate: dueDate.toISOString(),
              data: subscription
            });
          }
        });
      }
      
      if (settings.budgetAlerts) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const startCurrentMonth = new Date(currentYear, currentMonth, 1);
        const endCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
        
        const currentMonthExpensesQuery = await prisma.$queryRaw`
          SELECT 
            COALESCE(category, 'Divers') as category,
            COALESCE(ABS(SUM(amount)), 0) as total
          FROM transactions
          WHERE 
            "userId" = ${user.userId}
            AND amount < 0
            AND "transactionDate" >= ${startCurrentMonth}
            AND "transactionDate" < ${endCurrentMonth}
          GROUP BY category
        `;
        
        const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
        
        const historicalExpensesQuery = await prisma.$queryRaw`
          SELECT 
            COALESCE(category, 'Divers') as category,
            COALESCE(ABS(SUM(amount)), 0) as total,
            COUNT(*) as count
          FROM transactions
          WHERE 
            "userId" = ${user.userId}
            AND amount < 0
            AND "transactionDate" >= ${threeMonthsAgo}
            AND "transactionDate" < ${startCurrentMonth}
          GROUP BY category
        `;
        
        const historicalMap = new Map<string, { total: number, count: number }>();
        
        for (const item of historicalExpensesQuery as any[]) {
          const category = item.category || 'Divers';
          const total = parseFloat(item.total) || 0;
          const count = parseInt(item.count) || 0;
          
          historicalMap.set(category, {
            total,
            count: count > 0 ? count : 1
          });
        }
        
        for (const item of currentMonthExpensesQuery as any[]) {
          const category = item.category || 'Divers';
          const currentAmount = parseFloat(item.total) || 0;
          
          const historical = historicalMap.get(category);
          
          if (historical) {
            const averageAmount = historical.total / 3; 
            
            if (currentAmount > averageAmount * 1.2) {
              alerts.push({
                type: 'budget_alert',
                message: `Vos dépenses dans la catégorie "${category}" (${currentAmount.toFixed(2)} €) dépassent de ${((currentAmount / averageAmount - 1) * 100).toFixed(0)}% votre moyenne habituelle`,
                severity: 'danger',
                date: new Date().toISOString(),
                data: {
                  category,
                  currentAmount,
                  averageAmount,
                  percentage: (currentAmount / averageAmount - 1) * 100
                }
              });
            }
          }
        }
      }
      
      if (settings.largeTransactionAlerts) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const largeTransactions = await prisma.transaction.findMany({
          where: {
            userId: user.userId,
            amount: {
              lt: -settings.largeTransactionAmount
            },
            transactionDate: {
              gte: sevenDaysAgo
            }
          },
          orderBy: {
            amount: 'asc'
          },
          take: 5
        });
        
        largeTransactions.forEach((transaction: Transaction) => {
          alerts.push({
            type: 'large_transaction',
            message: `Transaction importante de ${Math.abs(transaction.amount).toFixed(2)} € pour "${transaction.description}" le ${new Date(transaction.transactionDate).toLocaleDateString('fr-FR')}`,
            severity: 'info',
            date: transaction.transactionDate.toISOString(),
            data: transaction
          });
        });
      }
      
      alerts.sort((a: Alert, b: Alert) => {
        const severityOrder: Record<string, number> = {
          'danger': 0,
          'warning': 1,
          'info': 2
        };
        
        const aSeverity = a.severity || 'info';
        const bSeverity = b.severity || 'info';
        
        const severityDiff = (severityOrder[aSeverity] ?? 2) - (severityOrder[bSeverity] ?? 2);
        
        if (severityDiff !== 0) return severityDiff;
        
        const dateA = a.date || a.dueDate || '';
        const dateB = b.date || b.dueDate || '';
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        return dateB.localeCompare(dateA);
      });
      
      return c.json({
        alerts
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      return c.json({ 
        error: 'Impossible de récupérer les alertes' 
      }, 500);
    }
  }
}

export default new NotificationController();