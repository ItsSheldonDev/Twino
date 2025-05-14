// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour créer une valeur avec délai (debounce)
 * @param {any} value - La valeur à retarder
 * @param {number} delay - Le délai en millisecondes
 * @returns {any} - La valeur retardée
 */
export function useDebounce(value, delay) {
  // État pour stocker la valeur retardée
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      // Mettre à jour la valeur après le délai
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Annuler le timeout si la valeur change à nouveau
      // ou si le composant est démonté
      return () => {
        clearTimeout(handler);
      };
    },
    // Exécuter uniquement si la valeur ou le délai change
    [value, delay]
  );

  return debouncedValue;
}

export default useDebounce;