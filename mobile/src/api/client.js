// src/api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import syncManager from '../utils/syncManager';
import { store } from '../store';
import { logout } from '../store/authSlice';

// Détermination de l'URL de base en fonction de l'environnement
const getBaseURL = () => {
  if (__DEV__) {
    // En développement - utilisez votre adresse IP locale pour accéder à l'API
    // depuis un émulateur ou un appareil physique
    const localIP = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${localIP}:3000/api`;
  } else {
    // En production
    return 'http://localhost:3000/api';
  }
};

// Créer une instance Axios avec la configuration par défaut
const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 secondes
});

// Ajouter un intercepteur pour attacher le token d'authentification à chaque requête
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si l'erreur est une erreur réseau (pas de connexion)
    if (error.message === 'Network Error' && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Vérifier si la requête est une opération qui peut être mise en file d'attente
      const isModifyOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
        originalRequest.method.toUpperCase()
      );
      
      if (isModifyOperation) {
        // Ajouter à la file d'attente de synchronisation
        await syncManager.enqueue(syncManager.QUEUE_KEYS.DEFAULT, {
          method: originalRequest.method,
          endpoint: originalRequest.url.replace(originalRequest.baseURL, ''),
          data: originalRequest.data,
        });
        
        // Informer l'utilisateur que l'opération sera effectuée plus tard
        console.log('Opération mise en file d\'attente pour synchronisation ultérieure');
        
        // Retourner une réponse simulée pour éviter une erreur dans l'application
        return Promise.resolve({
          status: 202,
          data: {
            message: 'Opération mise en file d\'attente pour synchronisation ultérieure',
            offlineQueued: true,
          },
        });
      }
    }
    
    // Gérer les erreurs 401 (non autorisé)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Vérifier si la requête était une tentative de connexion
      const isLoginRequest = originalRequest.url.includes('/auth/login');
      
      if (!isLoginRequest) {
        // Laisser l'écran de connexion gérer lui-même ses erreurs 401
        originalRequest._retry = true;
        
        try {
          // Effacer le token et rediriger vers la page de connexion
          await AsyncStorage.removeItem('authToken');
          
          // Dispatch de l'action de déconnexion
          store.dispatch(logout());
          
          console.log('Session expirée, redirection vers la page de connexion');
        } catch (e) {
          console.error('Erreur lors de la déconnexion:', e);
        }
      }
    }
    
    // Gérer les erreurs 403 (interdit)
    if (error.response && error.response.status === 403) {
      console.error('Accès refusé:', error.response.data);
    }
    
    // Gérer les erreurs 500 (erreur serveur)
    if (error.response && error.response.status >= 500) {
      console.error('Erreur serveur:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;