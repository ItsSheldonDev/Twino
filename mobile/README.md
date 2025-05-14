// README.md
# Twino - Application mobile de gestion de budget pour couples

Twino est une application mobile de gestion de budget spécialement conçue pour les couples. Elle permet de suivre les dépenses, les abonnements et l'épargne, tout en facilitant le partage des coûts entre partenaires.

## Fonctionnalités principales

- 📊 **Tableau de bord** : Vue d'ensemble des finances avec statistiques et graphiques
- 💳 **Gestion des transactions** : Suivi des dépenses et revenus avec catégorisation
- 📅 **Abonnements** : Suivi des abonnements récurrents avec rappels
- 💰 **Épargne** : Gestion des comptes d'épargne et objectifs
- 👥 **Dépenses partagées** : Répartition équitable des dépenses communes
- 🏦 **Connexions bancaires** : Synchronisation des transactions bancaires (optionnelle)
- 📱 **Mode hors ligne** : Utilisation complète même sans connexion internet

## Technologies utilisées

- **React Native** avec **Expo** pour le développement cross-platform
- **NativeBase** pour les composants UI
- **React Navigation** pour la navigation entre écrans
- **Redux Toolkit** et **Redux Persist** pour la gestion d'état global et la persistance
- **React Query** pour la gestion des données côté client
- **Axios** pour les requêtes API
- **date-fns** pour la manipulation des dates
- **Victory Native** pour les visualisations et graphiques

## Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn
- Expo CLI installé globalement (`npm install -g expo-cli`)
- Un émulateur iOS/Android ou un appareil physique pour le test

## Installation

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/twino-app.git
   cd twino-app/mobile
   ```

2. Installer les dépendances :
   ```bash
   npm install
   # ou avec yarn
   yarn install
   ```

3. Démarrer l'application :
   ```bash
   npx expo start
   ```

4. Lancer sur émulateur ou appareil :
   - Appuyez sur `i` pour iOS
   - Appuyez sur `a` pour Android
   - Scannez le QR code avec l'app Expo Go sur votre appareil physique

## Structure du projet

```
mobile/
├── assets/           # Images, polices, etc.
├── src/
│   ├── api/          # Configuration API et requêtes
│   ├── components/   # Composants réutilisables
│   ├── hooks/        # Hooks personnalisés
│   ├── navigation/   # Configuration de la navigation
│   ├── screens/      # Écrans de l'application
│   ├── store/        # Configuration Redux
│   ├── theme/        # Thème et styles
│   └── utils/        # Fonctions utilitaires
├── App.js            # Point d'entrée de l'application
├── app.json          # Configuration Expo
└── package.json      # Dépendances et scripts
```

## Gestion hors ligne

L'application implémente une stratégie de synchronisation hors ligne permettant aux utilisateurs de :

1. Consulter leurs données même sans connexion
2. Créer/modifier des transactions, abonnements et autres données en mode hors ligne
3. Synchroniser automatiquement les modifications lorsque la connexion est rétablie

## API Backend

L'application communique avec une API RESTful dont la documentation se trouve dans le dossier `backend` à la racine du projet. Voir le fichier `backend/README.md` pour plus d'informations sur la configuration et le déploiement du backend.

## Déploiement

### iOS

1. Configurer le fichier `app.json` avec les informations de votre compte développeur Apple
2. Construire l'application :
   ```bash
   eas build --platform ios
   ```

### Android

1. Configurer le fichier `app.json` avec les informations de votre compte développeur Google
2. Construire l'application :
   ```bash
   eas build --platform android
   ```

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request pour améliorer l'application.

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.