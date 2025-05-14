// src/utils/formatters.js
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate un montant en devise Euro
 * @param {number} amount - Montant à formater
 * @param {Object} options - Options de formatage
 * @returns {string} - Montant formaté
 */
export const formatCurrency = (amount, options = {}) => {
  const { 
    minimumFractionDigits = 0, 
    maximumFractionDigits = 2, 
    showSymbol = true 
  } = options;
  
  if (amount === null || amount === undefined) {
    return '—';
  }
  
  return new Intl.NumberFormat('fr-FR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'EUR',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
};

/**
 * Formate une date selon le format spécifié
 * @param {string|Date} date - Date à formater
 * @param {string} formatStr - Format de date (voir date-fns)
 * @param {Object} options - Options supplémentaires
 * @returns {string} - Date formatée
 */
export const formatDate = (date, formatStr = 'd MMMM yyyy', options = {}) => {
  if (!date) return '';
  
  // Si la date est une chaîne, on la convertit
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  // Vérifier si la date est valide
  if (!isValid(dateObj)) return 'Date invalide';
  
  return format(dateObj, formatStr, {
    locale: fr,
    ...options
  });
};

/**
 * Tronque un texte à une longueur donnée
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} - Texte tronqué
 */
export const truncateText = (text, maxLength = 30) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Formate un pourcentage
 * @param {number} value - Valeur à formater
 * @param {Object} options - Options de formatage
 * @returns {string} - Pourcentage formaté
 */
export const formatPercentage = (value, options = {}) => {
  const { 
    minimumFractionDigits = 0, 
    maximumFractionDigits = 2 
  } = options;
  
  if (value === null || value === undefined) {
    return '—';
  }
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
};

/**
 * Formate un numéro de téléphone français
 * @param {string} phone - Numéro à formater
 * @returns {string} - Numéro formaté
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Enlever tous les caractères non numériques
  const cleaned = ('' + phone).replace(/\D/g, '');
  
  // Vérifier si le numéro a la bonne longueur
  if (cleaned.length !== 10) return phone;
  
  // Formater pour la France : XX XX XX XX XX
  return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
};

/**
 * Formate un IBAN
 * @param {string} iban - IBAN à formater
 * @returns {string} - IBAN formaté
 */
export const formatIBAN = (iban) => {
  if (!iban) return '';
  
  // Enlever les espaces et mettre en majuscules
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  
  // Formater par blocs de 4 caractères
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

export default {
  formatCurrency,
  formatDate,
  truncateText,
  formatPercentage,
  formatPhoneNumber,
  formatIBAN
};