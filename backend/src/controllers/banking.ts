import type { Context } from 'hono';
import { prisma } from '../app';
import goCardlessService from '../services/external/goCardless';
import Config from '../config';

export class BankingController {
  async getInstitutions(c: Context) {
    try {
      const country = c.req.query('country') || 'fr';
      const institutions = await goCardlessService.getInstitutions(country);
      
      return c.json({
        institutions
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des institutions:', error);
      return c.json({ 
        error: 'Impossible de récupérer la liste des banques' 
      }, 500);
    }
  }
  
  async initiateConnection(c: Context) {
    try {
      const user = c.get('user');
      const data = await c.req.json();
      const { institutionId } = data;
      
      if (!institutionId) {
        return c.json({ 
          error: 'ID d\'institution requis' 
        }, 400);
      }
      

      const agreement = await goCardlessService.createEndUserAgreement(
        institutionId,
        Config.TRANSACTION_SYNC_DAYS
      );
      

      const callbackUrl = `${Config.APP_URL}/api/banking/callback`;
      

      const requisition = await goCardlessService.createRequisition(
        institutionId,
        callbackUrl,
        user.userId,
        agreement.id
      );
      
      // Mise à jour des informations de l'utilisateur
      await prisma.user.update({
        where: { id: user.userId },
        data: {
          requisitionId: requisition.id
        }
      });
      
      return c.json({
        link: requisition.link,
        requisitionId: requisition.id
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la connexion bancaire:', error);
      return c.json({ 
        error: 'Impossible d\'initialiser la connexion bancaire' 
      }, 500);
    }
  }
  
  async handleCallback(c: Context) {
    try {
      const requisitionId = c.req.query('requisition_id');
      
      if (!requisitionId) {
        return c.json({ 
          error: 'ID de réquisition manquant' 
        }, 400);
      }
      

      const requisitionDetails = await goCardlessService.getRequisition(requisitionId);
      

      if (requisitionDetails.status.short !== 'LN' && requisitionDetails.status.short !== 'GA') {
        return c.json({ 
          error: 'La connexion bancaire a échoué', 
          status: requisitionDetails.status 
        }, 400);
      }
      

      const user = await prisma.user.findFirst({
        where: { 
          requisitionId: requisitionId 
        }
      });
      
      if (!user) {
        return c.json({ 
          error: 'Utilisateur non trouvé' 
        }, 404);
      }
      
      // Mise à jour des informations de l'utilisateur
      await prisma.user.update({
        where: { id: user.id },
        data: {
          bankConnectionId: requisitionDetails.id,
          bankAccountIds: requisitionDetails.accounts
        }
      });
      
      return c.json({
        success: true,
        message: 'Connexion bancaire établie avec succès',
        accounts: requisitionDetails.accounts
      });
    } catch (error) {
      console.error('Erreur lors du traitement du callback bancaire:', error);
      return c.json({ 
        error: 'Erreur lors de la connexion bancaire' 
      }, 500);
    }
  }
  
  async syncTransactions(c: Context) {
    try {
      const user = c.get('user');
      
      // Récupération des informations bancaires de l'utilisateur
      const userInfo = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          bankAccountIds: true
        }
      });
      
      if (!userInfo || !userInfo.bankAccountIds || userInfo.bankAccountIds.length === 0) {
        return c.json({ 
          error: 'Aucun compte bancaire connecté' 
        }, 400);
      }
      
      const results = [];
      let totalTransactions = 0;
      

      for (const accountId of userInfo.bankAccountIds) {
        const transactions = await goCardlessService.getAccountTransactions(accountId);
        const accountDetails = await goCardlessService.getAccountDetails(accountId);
        

        if (transactions.transactions && transactions.transactions.booked) {
          for (const transaction of transactions.transactions.booked) {

            const existingTransaction = await prisma.transaction.findUnique({
              where: {
                externalId: transaction.transactionId || `${accountId}-${transaction.bookingDate}-${transaction.valueDate}-${transaction.transactionAmount.amount}`
              }
            });
            
            if (!existingTransaction) {

              await prisma.transaction.create({
                data: {
                  userId: user.userId,
                  externalId: transaction.transactionId || `${accountId}-${transaction.bookingDate}-${transaction.valueDate}-${transaction.transactionAmount.amount}`,
                  amount: parseFloat(transaction.transactionAmount.amount),
                  currency: transaction.transactionAmount.currency,
                  description: transaction.remittanceInformationUnstructured || 'Transaction sans description',
                  category: this.categorizeTransaction(transaction.remittanceInformationUnstructured || ''),
                  transactionDate: new Date(transaction.bookingDate),
                  bookingDate: transaction.bookingDate ? new Date(transaction.bookingDate) : null,
                  valueDate: transaction.valueDate ? new Date(transaction.valueDate) : null,
                  isRecurring: this.detectRecurringTransaction(transaction.remittanceInformationUnstructured || '')
                }
              });
              
              totalTransactions++;
            }
          }
        }
        

        results.push({
          accountId,
          name: accountDetails.account?.name || 'Compte bancaire',
          iban: accountDetails.account?.iban,
          currency: accountDetails.account?.currency,
          transactions: transactions.transactions?.booked?.length || 0
        });
      }
      
      return c.json({
        success: true,
        message: `${totalTransactions} nouvelles transactions synchronisées`,
        accounts: results
      });
    } catch (error) {
      console.error('Erreur lors de la synchronisation des transactions:', error);
      return c.json({ 
        error: 'Impossible de synchroniser les transactions' 
      }, 500);
    }
  }
  
  async getAccountBalances(c: Context) {
    try {
      const user = c.get('user');
      
      // Récupération des informations bancaires de l'utilisateur
      const userInfo = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          bankAccountIds: true
        }
      });
      
      if (!userInfo || !userInfo.bankAccountIds || userInfo.bankAccountIds.length === 0) {
        return c.json({ 
          error: 'Aucun compte bancaire connecté' 
        }, 400);
      }
      
      const balances = [];
      
      // Récupération des soldes pour chaque compte
      for (const accountId of userInfo.bankAccountIds) {
        const accountBalance = await goCardlessService.getAccountBalances(accountId);
        const accountDetails = await goCardlessService.getAccountDetails(accountId);
        
        balances.push({
          accountId,
          name: accountDetails.account?.name || 'Compte bancaire',
          iban: accountDetails.account?.iban,
          currency: accountBalance.balances?.[0]?.balanceAmount?.currency || 'EUR',
          balance: accountBalance.balances?.[0]?.balanceAmount?.amount || '0',
          balanceType: accountBalance.balances?.[0]?.balanceType || 'information',
          lastUpdate: accountBalance.balances?.[0]?.lastChangeDateTime || new Date().toISOString()
        });
      }
      
      return c.json({
        success: true,
        balances
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des soldes:', error);
      return c.json({ 
        error: 'Impossible de récupérer les soldes des comptes' 
      }, 500);
    }
  }
  
  // Méthode utilitaire pour catégoriser automatiquement les transactions
  private categorizeTransaction(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    // Logique de catégorisation basée sur des mots-clés
    if (lowerDesc.includes('loyer') || lowerDesc.includes('rent')) {
      return 'Logement';
    } else if (lowerDesc.includes('salaire') || lowerDesc.includes('salary') || lowerDesc.includes('paie')) {
      return 'Revenu';
    } else if (lowerDesc.includes('restaurant') || lowerDesc.includes('uber eats') || lowerDesc.includes('deliveroo')) {
      return 'Restauration';
    } else if (lowerDesc.includes('carrefour') || lowerDesc.includes('auchan') || lowerDesc.includes('leclerc') || lowerDesc.includes('monoprix')) {
      return 'Courses';
    } else if (lowerDesc.includes('sncf') || lowerDesc.includes('ratp') || lowerDesc.includes('uber') || lowerDesc.includes('taxi')) {
      return 'Transport';
    } else if (lowerDesc.includes('amazon') || lowerDesc.includes('fnac') || lowerDesc.includes('darty')) {
      return 'Shopping';
    } else if (lowerDesc.includes('netflix') || lowerDesc.includes('spotify') || lowerDesc.includes('canal') || lowerDesc.includes('disney')) {
      return 'Abonnements';
    } else if (lowerDesc.includes('edf') || lowerDesc.includes('engie') || lowerDesc.includes('eau')) {
      return 'Factures';
    }
    
    return 'Divers';
  }
  
  // Méthode pour détecter si une transaction est récurrente
  private detectRecurringTransaction(description: string): boolean {
    const lowerDesc = description.toLowerCase();
    
    // Mots-clés pour les transactions récurrentes
    const recurringKeywords = [
      'abonnement', 'mensuel', 'subscription', 'monthly', 'netflix', 'spotify',
      'prime', 'forfait', 'assurance', 'loyer', 'rent', 'salary', 'salaire'
    ];
    
    return recurringKeywords.some(keyword => lowerDesc.includes(keyword));
  }
}

export default new BankingController();