// src/config/index.ts

import dotenv from 'dotenv';
dotenv.config();

export const Config = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-key-change-this',
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '24h',
  
  GOCARDLESS: {
    SECRET_ID: process.env.GOCARDLESS_SECRET_ID,
    SECRET_KEY: process.env.GOCARDLESS_SECRET_KEY,
    BASE_URL: process.env.GOCARDLESS_BASE_URL || 'https://bankaccountdata.gocardless.com/api/v2',
  },
  
  MAILJET: {
    API_KEY: process.env.MAILJET_API_KEY || '',
    API_SECRET: process.env.MAILJET_API_SECRET || '',
    FROM_EMAIL: process.env.MAILJET_FROM_EMAIL || 'noreply@budgetcouple.com',
    FROM_NAME: process.env.MAILJET_FROM_NAME || 'Budget Couple',
  },
  
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080',
  
  // Paramètres de l'application
  MAX_USERS: 2, // Nombre maximum d'utilisateurs autorisés
  DEFAULT_CURRENCY: 'EUR',
  TRANSACTION_SYNC_DAYS: 90, // Nombre de jours d'historique de transactions à synchroniser
  PROFILE_PHOTO_MAX_SIZE: 5 * 1024 * 1024, // 5 MB en octets
  PASSWORD_RESET_EXPIRY: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
};

export default Config;