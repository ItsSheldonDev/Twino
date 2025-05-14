// src/utils/syncManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import apiClient from '../api/client';

/**
 * Gestionnaire de synchronisation des données hors ligne
 */
class SyncManager {
  constructor() {
    // Clés pour le stockage des files d'attente
    this.QUEUE_KEYS = {
      SUBSCRIPTIONS: '@sync_queue_subscriptions',
      TRANSACTIONS: '@sync_queue_transactions',
      SHARED_EXPENSES: '@sync_queue_shared_expenses',
      SAVINGS: '@sync_queue_savings',
    };
    
    // Initialisation des listeners de connectivité
    this.initNetworkListeners();
  }
  
  /**
   * Initialise les listeners pour les changements de connectivité
   */
  initNetworkListeners() {
    NetInfo.addEventListener(state => {
      // Si on récupère la connectivité internet, tenter de synchroniser
      if (state.isConnected && state.isInternetReachable) {
        this.syncAll();
      }
    });
  }
  
  /**
   * Ajoute une opération à la file d'attente
   * @param {string} queueKey - Clé de la file d'attente
   * @param {Object} operation - Opération à ajouter
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  async enqueue(queueKey, operation) {
    try {
      // Récupérer la file d'attente existante
      const queue = await this.getQueue(queueKey);
      
      // Ajouter l'opération avec un ID unique
      queue.push({
        ...operation,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      });
      
      // Sauvegarder la file d'attente mise à jour
      await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
      
      // Tenter une synchronisation immédiate si possible
      const netState = await NetInfo.fetch();
      if (netState.isConnected && netState.isInternetReachable) {
        this.syncQueue(queueKey);
      }
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'ajout à la file d'attente ${queueKey}:`, error);
      return false;
    }
  }
  
  /**
   * Récupère une file d'attente
   * @param {string} queueKey - Clé de la file d'attente
   * @returns {Promise<Array>} - File d'attente
   */
  async getQueue(queueKey) {
    try {
      const queueJson = await AsyncStorage.getItem(queueKey);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error(`Erreur lors de la récupération de la file d'attente ${queueKey}:`, error);
      return [];
    }
  }
  
  /**
   * Sauvegarde une file d'attente
   * @param {string} queueKey - Clé de la file d'attente
   * @param {Array} queue - File d'attente à sauvegarder
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  async saveQueue(queueKey, queue) {
    try {
      await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de la file d'attente ${queueKey}:`, error);
      return false;
    }
  }
  
  /**
   * Synchronise une file d'attente spécifique
   * @param {string} queueKey - Clé de la file d'attente
   * @returns {Promise<{success: number, failed: number}>} - Statistiques de synchronisation
   */
  async syncQueue(queueKey) {
    const stats = { success: 0, failed: 0 };
    
    try {
      // Vérifier la connectivité
      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        return stats;
      }
      
      // Récupérer la file d'attente
      const queue = await this.getQueue(queueKey);
      if (queue.length === 0) return stats;
      
      // Créer une nouvelle file avec les opérations échouées
      const failedQueue = [];
      
      // Traiter chaque opération
      for (const operation of queue) {
        try {
          // Exécuter l'opération en fonction de son type
          await this.executeOperation(operation);
          stats.success++;
        } catch (error) {
          console.error(`Erreur lors de la synchronisation de l'opération:`, error);
          stats.failed++;
          
          // Si l'opération n'est pas trop ancienne (< 7 jours), la garder
          const isRecent = Date.now() - operation.timestamp < 7 * 24 * 60 * 60 * 1000;
          if (isRecent) {
            failedQueue.push(operation);
          }
        }
      }
      
      // Mettre à jour la file d'attente avec les opérations échouées
      await this.saveQueue(queueKey, failedQueue);
      
      return stats;
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de la file d'attente ${queueKey}:`, error);
      return stats;
    }
  }
  
  /**
   * Exécute une opération
   * @param {Object} operation - Opération à exécuter
   * @returns {Promise<Object>} - Résultat de l'opération
   */
  async executeOperation(operation) {
    const { method, endpoint, data, id } = operation;
    
    switch (method.toUpperCase()) {
      case 'POST':
        return apiClient.post(endpoint, data);
      case 'PATCH':
        return apiClient.patch(endpoint, data);
      case 'PUT':
        return apiClient.put(endpoint, data);
      case 'DELETE':
        return apiClient.delete(endpoint);
      default:
        throw new Error(`Méthode HTTP non supportée: ${method}`);
    }
  }
  
  /**
   * Synchronise toutes les files d'attente
   * @returns {Promise<Object>} - Statistiques de synchronisation
   */
  async syncAll() {
    const results = {};
    
    // Synchroniser chaque file d'attente
    for (const [key, queueKey] of Object.entries(this.QUEUE_KEYS)) {
      results[key] = await this.syncQueue(queueKey);
    }
    
    return results;
  }
  
  /**
   * Ajoute une opération de création d'abonnement
   * @param {Object} subscription - Données de l'abonnement
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  async addSubscription(subscription) {
    return this.enqueue(this.QUEUE_KEYS.SUBSCRIPTIONS, {
      method: 'POST',
      endpoint: '/subscriptions',
      data: subscription,
    });
  }
  
  /**
   * Ajoute une opération de mise à jour d'abonnement
   * @param {string} id - ID de l'abonnement
   * @param {Object} subscription - Données de l'abonnement
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  async updateSubscription(id, subscription) {
    return this.enqueue(this.QUEUE_KEYS.SUBSCRIPTIONS, {
      method: 'PATCH',
      endpoint: `/subscriptions/${id}`,
      data: subscription,
    });
  }
  
  /**
   * Ajoute une opération de suppression d'abonnement
   * @param {string} id - ID de l'abonnement
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  async deleteSubscription(id) {
    return this.enqueue(this.QUEUE_KEYS.SUBSCRIPTIONS, {
      method: 'DELETE',
      endpoint: `/subscriptions/${id}`,
    });
  }
  
  /**
   * Ajoute une opération de mise à jour de transaction
   * @param {string} id - ID de la transaction
   * @param {Object} transaction - Données de la transaction
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  async updateTransaction(id, transaction) {
    return this.enqueue(this.QUEUE_KEYS.TRANSACTIONS, {
      method: 'PATCH',
      endpoint: `/transactions/${id}`,
      data: transaction,
    });
  }
  
  /**
   * Ajoute une opération de création de dépense partagée
   * @param {Object} expense - Données de la dépense
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  async addSharedExpense(expense) {
    return this.enqueue(this.QUEUE_KEYS.SHARED_EXPENSES, {
      method: 'POST',
      endpoint: '/shared/expenses',
      data: expense,
    });
  }
  
  /**
   * Ajoute une opération de mise à jour de dépense partagée
   * @param {string} id - ID de la dépense
   * @param {Object} expense - Données de la dépense
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  async updateSharedExpense(id, expense) {
    return this.enqueue(this.QUEUE_KEYS.SHARED_EXPENSES, {
      method: 'PATCH',
      endpoint: `/shared/expenses/${id}`,
      data: expense,
    });
  }
  
  /**
   * Ajoute une opération de suppression de dépense partagée
   * @param {string} id - ID de la dépense
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  async deleteSharedExpense(id) {
    return this.enqueue(this.QUEUE_KEYS.SHARED_EXPENSES, {
      method: 'DELETE',
      endpoint: `/shared/expenses/${id}`,
    });
  }
  
  /**
   * Ajoute une opération de création d'un compte d'épargne
   * @param {Object} account - Données du compte
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  async addSavingsAccount(account) {
    return this.enqueue(this.QUEUE_KEYS.SAVINGS, {
      method: 'POST',
      endpoint: '/savings/accounts',
      data: account,
    });
  }
  
  /**
   * Ajoute une opération de création d'un objectif d'épargne
   * @param {Object} goal - Données de l'objectif
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  async addSavingsGoal(goal) {
    return this.enqueue(this.QUEUE_KEYS.SAVINGS, {
      method: 'POST',
      endpoint: '/savings/goals',
      data: goal,
    });
  }
  
  /**
   * Vérifie si des opérations sont en attente de synchronisation
   * @returns {Promise<boolean>} - true si des opérations sont en attente
   */
  async hasPendingOperations() {
    for (const queueKey of Object.values(this.QUEUE_KEYS)) {
      const queue = await this.getQueue(queueKey);
      if (queue.length > 0) return true;
    }
    return false;
  }
  
  /**
   * Compte le nombre d'opérations en attente
   * @returns {Promise<number>} - Nombre d'opérations
   */
  async countPendingOperations() {
    let count = 0;
    for (const queueKey of Object.values(this.QUEUE_KEYS)) {
      const queue = await this.getQueue(queueKey);
      count += queue.length;
    }
    return count;
  }
}

// Exporter une instance singleton
export default new SyncManager();