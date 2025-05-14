// src/hooks/useAsyncStorage.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook personnalisé pour utiliser AsyncStorage avec un état React
 * @param {string} key - Clé de stockage
 * @param {any} initialValue - Valeur initiale
 * @returns {Array} - [storedValue, setValue, loading, error]
 */
export function useAsyncStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour récupérer la valeur depuis AsyncStorage
  const getStoredValue = async () => {
    try {
      setLoading(true);
      const item = await AsyncStorage.getItem(key);
      
      // Si aucun élément n'est trouvé, retourner la valeur initiale
      if (item === null) {
        setStoredValue(initialValue);
      } else {
        // Sinon, parser et définir la valeur stockée
        setStoredValue(JSON.parse(item));
      }
      
      setError(null);
    } catch (e) {
      setError(e);
      console.error('Erreur lors de la récupération de la valeur stockée:', e);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour stocker une nouvelle valeur
  const setValue = async (value) => {
    try {
      setLoading(true);
      // Permettre à la valeur d'être une fonction (comme pour setState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Sauvegarder dans l'état et dans AsyncStorage
      setStoredValue(valueToStore);
      await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
      
      setError(null);
    } catch (e) {
      setError(e);
      console.error('Erreur lors de la sauvegarde de la valeur:', e);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer la valeur
  const removeValue = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem(key);
      setStoredValue(initialValue);
      setError(null);
    } catch (e) {
      setError(e);
      console.error('Erreur lors de la suppression de la valeur:', e);
    } finally {
      setLoading(false);
    }
  };

  // Charger la valeur stockée au montage du composant
  useEffect(() => {
    getStoredValue();
  }, [key]);

  return [storedValue, setValue, { loading, error, removeValue, refresh: getStoredValue }];
}

export default useAsyncStorage;