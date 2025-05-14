// src/navigation/index.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { Icon, Box } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import OfflineNotice from '../components/shared/OfflineNotice';

// Import des écrans
// Écrans d'authentification
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Écrans principaux
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import AddTransactionScreen from '../screens/transactions/AddTransactionScreen';
import TransactionDetailScreen from '../screens/transactions/TransactionDetailScreen';
import SubscriptionsScreen from '../screens/subscriptions/SubscriptionsScreen';
import AddSubscriptionScreen from '../screens/subscriptions/AddSubscriptionScreen';
import SubscriptionDetailScreen from '../screens/subscriptions/SubscriptionDetailScreen';
import SavingsScreen from '../screens/savings/SavingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Créer les navigateurs
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navigateur d'authentification (non authentifié)
const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </Stack.Navigator>
);

// Navigateur des transactions
const TransactionsNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TransactionsList" component={TransactionsScreen} />
    <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
    <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
  </Stack.Navigator>
);

// Navigateur des abonnements
const SubscriptionsNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SubscriptionsList" component={SubscriptionsScreen} />
    <Stack.Screen name="AddSubscription" component={AddSubscriptionScreen} />
    <Stack.Screen name="SubscriptionDetail" component={SubscriptionDetailScreen} />
  </Stack.Navigator>
);

// Bottom Tab Navigator (authentifié)
const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Dashboard') {
          iconName = 'dashboard';
        } else if (route.name === 'Transactions') {
          iconName = 'receipt';
        } else if (route.name === 'Subscriptions') {
          iconName = 'subscriptions';
        } else if (route.name === 'Savings') {
          iconName = 'savings';
        } else if (route.name === 'Profile') {
          iconName = 'person';
        }

        return <Icon as={MaterialIcons} name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#0091ff', // primary.500
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: {
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 12,
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Tableau de bord' }} />
    <Tab.Screen name="Transactions" component={TransactionsNavigator} options={{ title: 'Transactions' }} />
    <Tab.Screen name="Subscriptions" component={SubscriptionsNavigator} options={{ title: 'Abonnements' }} />
    <Tab.Screen name="Savings" component={SavingsScreen} options={{ title: 'Épargne' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
  </Tab.Navigator>
);

// Navigateur principal avec gestion de la connexion hors ligne
const MainNavigatorWithOffline = () => (
  <>
    <OfflineNotice />
    <MainTabNavigator />
  </>
);

// Navigateur racine
const AppNavigator = () => {
  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigatorWithOffline} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;