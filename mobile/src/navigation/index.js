import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { Icon } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

// Import des écrans (à créer)
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import SubscriptionsScreen from '../screens/subscriptions/SubscriptionsScreen';
import SavingsScreen from '../screens/savings/SavingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Créez les navigateurs
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navigateur d'authentification (non authentifié)
const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Bottom Tab Navigator (authentifié)
const MainNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
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
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Transactions" component={TransactionsScreen} />
    <Tab.Screen name="Subscriptions" component={SubscriptionsScreen} />
    <Tab.Screen name="Savings" component={SavingsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Navigateur racine
const AppNavigator = () => {
  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;