// src/utils/validators.js
/**
 * Utilitaires de validation pour les formulaires
 */

/**
 * Vérifie si une chaîne est vide ou null
 * @param {string} value - Valeur à vérifier
 * @returns {boolean} - true si la chaîne est vide
 */
export const isEmpty = (value) => {
    return value === null || value === undefined || value.trim() === '';
  };
  
  /**
   * Vérifie si une valeur est un email valide
   * @param {string} email - Email à vérifier
   * @returns {boolean} - true si l'email est valide
   */
  export const isValidEmail = (email) => {
    if (isEmpty(email)) return false;
    
    // Expression régulière pour vérifier un email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * Vérifie si un mot de passe respecte les règles de sécurité
   * @param {string} password - Mot de passe à vérifier
   * @returns {Object} - Résultat de validation avec détails
   */
  export const validatePassword = (password) => {
    if (isEmpty(password)) {
      return { isValid: false, message: 'Le mot de passe est requis' };
    }
    
    const result = {
      isValid: true,
      hasMinLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasDigit: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      message: ''
    };
    
    // Vérifier si toutes les règles sont respectées
    if (!result.hasMinLength) {
      result.isValid = false;
      result.message = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    return result;
  };
  
  /**
   * Vérifie si deux mots de passe correspondent
   * @param {string} password - Mot de passe
   * @param {string} confirmPassword - Confirmation du mot de passe
   * @returns {boolean} - true si les mots de passe correspondent
   */
  export const doPasswordsMatch = (password, confirmPassword) => {
    return password === confirmPassword;
  };
  
  /**
   * Vérifie si un montant est valide
   * @param {string|number} amount - Montant à vérifier
   * @returns {boolean} - true si le montant est valide
   */
  export const isValidAmount = (amount) => {
    if (amount === null || amount === undefined || amount === '') return false;
    
    // Convertir en nombre si c'est une chaîne
    const numberAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Vérifier si c'est un nombre valide
    return !isNaN(numberAmount);
  };
  
  /**
   * Vérifie si un IBAN est valide
   * @param {string} iban - IBAN à vérifier
   * @returns {boolean} - true si l'IBAN est valide
   */
  export const isValidIBAN = (iban) => {
    if (isEmpty(iban)) return false;
    
    // Nettoyer l'IBAN (enlever les espaces et mettre en majuscules)
    const cleanedIBAN = iban.replace(/\s/g, '').toUpperCase();
    
    // Vérification simple de la longueur et du format
    // Note: Cette vérification est basique, une validation complète nécessiterait une bibliothèque
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
    
    return ibanRegex.test(cleanedIBAN);
  };
  
  /**
   * Vérifie si une date est valide
   * @param {string|Date} date - Date à vérifier
   * @returns {boolean} - true si la date est valide
   */
  export const isValidDate = (date) => {
    if (!date) return false;
    
    // Si c'est déjà un objet Date
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }
    
    // Si c'est une chaîne, essayer de la convertir
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  };
  
  /**
   * Vérifier si une valeur est un pourcentage valide (0-100)
   * @param {string|number} value - Valeur à vérifier
   * @returns {boolean} - true si c'est un pourcentage valide
   */
  export const isValidPercentage = (value) => {
    if (value === null || value === undefined || value === '') return false;
    
    // Convertir en nombre
    const numberValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Vérifier si c'est un nombre valide entre 0 et 100
    return !isNaN(numberValue) && numberValue >= 0 && numberValue <= 100;
  };
  
  /**
   * Vérifie si un numéro de téléphone est valide
   * @param {string} phone - Numéro à vérifier
   * @returns {boolean} - true si le numéro est valide
   */
  export const isValidPhoneNumber = (phone) => {
    if (isEmpty(phone)) return false;
    
    // Supprimer tous les caractères non numériques
    const cleanedPhone = phone.replace(/\D/g, '');
    
    // Vérifier que le numéro a 10 chiffres (format français)
    return cleanedPhone.length === 10;
  };
  
  /**
   * Valide un formulaire complet
   * @param {Object} values - Valeurs du formulaire
   * @param {Object} rules - Règles de validation
   * @returns {Object} - Erreurs trouvées
   */
  export const validateForm = (values, rules) => {
    const errors = {};
    
    // Parcourir toutes les règles
    Object.entries(rules).forEach(([field, validations]) => {
      const value = values[field];
      
      // Vérifier chaque règle pour ce champ
      validations.forEach(validation => {
        // Ignorer si une erreur a déjà été trouvée pour ce champ
        if (errors[field]) return;
        
        switch (validation.type) {
          case 'required':
            if (isEmpty(value)) {
              errors[field] = validation.message || 'Ce champ est requis';
            }
            break;
            
          case 'email':
            if (!isEmpty(value) && !isValidEmail(value)) {
              errors[field] = validation.message || 'Email invalide';
            }
            break;
            
          case 'minLength':
            if (!isEmpty(value) && value.length < validation.value) {
              errors[field] = validation.message || `Minimum ${validation.value} caractères`;
            }
            break;
            
          case 'maxLength':
            if (!isEmpty(value) && value.length > validation.value) {
              errors[field] = validation.message || `Maximum ${validation.value} caractères`;
            }
            break;
            
          case 'match':
            if (!isEmpty(value) && value !== values[validation.field]) {
              errors[field] = validation.message || `Ne correspond pas au champ ${validation.field}`;
            }
            break;
            
          case 'amount':
            if (!isEmpty(value) && !isValidAmount(value)) {
              errors[field] = validation.message || 'Montant invalide';
            }
            break;
            
          case 'date':
            if (!isEmpty(value) && !isValidDate(value)) {
              errors[field] = validation.message || 'Date invalide';
            }
            break;
            
          case 'custom':
            if (!validation.validate(value, values)) {
              errors[field] = validation.message || 'Valeur invalide';
            }
            break;
        }
      });
    });
    
    return errors;
  };
  
  export default {
    isEmpty,
    isValidEmail,
    validatePassword,
    doPasswordsMatch,
    isValidAmount,
    isValidIBAN,
    isValidDate,
    isValidPercentage,
    isValidPhoneNumber,
    validateForm
  };