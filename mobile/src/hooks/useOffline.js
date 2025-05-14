// src/hooks/useOffline.js
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Hook personnalisé pour suivre l'état de la connexion internet
 * @returns {Object} - État de la connexion et méthodes associées
 */
export function useOffline() {
  // État pour suivre la connexion
  const [isOffline, setIsOffline] = useState(false);
  
  // Permet de forcer une vérification manuelle de la connexion
  const checkConnection = async () => {
    const state = await NetInfo.fetch();
    setIsOffline(!state.isConnected);
    return state.isConnected;
  };

  useEffect(() => {
    // Première vérification au montage
    checkConnection();
    
    // Abonnement aux changements d'état de connexion
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    // Nettoyage de l'abonnement
    return () => unsubscribe();
  }, []);

  return {
    isOffline,
    checkConnection
  };
}

export default useOffline;