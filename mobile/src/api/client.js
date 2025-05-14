import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Définissez l'URL de base de votre API
const BASE_URL = 'http://[VOTRE_IP_LOCALE]:3000/api';

// Créez une instance Axios avec la configuration par défaut
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajoutez un intercepteur pour attacher le token d'authentification à chaque requête
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse (comme les 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Gérer les erreurs 401 (non autorisé)
    if (error.response && error.response.status === 401) {
      // Effacer le token et rediriger vers la page de connexion
      await AsyncStorage.removeItem('authToken');
      // La logique de redirection sera gérée par le navigateur
    }
    return Promise.reject(error);
  }
);

export default apiClient;