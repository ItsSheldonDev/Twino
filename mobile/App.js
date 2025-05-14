// src/App.js
import React, { useEffect, useState } from 'react';
import { NativeBaseProvider } from 'native-base';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import AppNavigator from './navigation';
import { theme } from './theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Asset } from 'expo-asset';

// Configuration de SplashScreen
SplashScreen.preventAutoHideAsync();

// Créer une instance de QueryClient avec configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 60, // 1 heure
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  },
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  
  // Préchargement des ressources
  useEffect(() => {
    async function prepare() {
      try {
        // Précharger les polices
        await Font.loadAsync({
          'Roboto_400Regular': require('../assets/fonts/Roboto-Regular.ttf'),
          'Roboto_500Medium': require('../assets/fonts/Roboto-Medium.ttf'),
          'Roboto_700Bold': require('../assets/fonts/Roboto-Bold.ttf'),
        });
        
        // Précharger les images
        await Asset.loadAsync([
          require('../assets/logo.png'),
          require('../assets/icon.png'),
        ]);
        
        // Récupérer le mode sombre
        const storedDarkMode = await AsyncStorage.getItem('darkMode');
        if (storedDarkMode) {
          const isDarkMode = JSON.parse(storedDarkMode);
          // Mettre à jour le thème si nécessaire
        }
        
        // Vérifier l'état de la connexion
        await NetInfo.fetch();
        
        // Simuler un délai pour voir le splash screen
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Marquer l'app comme prête
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);
  
  // Masquer le splash screen quand l'app est prête
  useEffect(() => {
    if (appIsReady) {
      // Cette fonction doit être asynchrone car SplashScreen.hideAsync est une promesse
      async function hideSplash() {
        await SplashScreen.hideAsync();
      }
      
      hideSplash();
    }
  }, [appIsReady]);
  
  if (!appIsReady) {
    return null;
  }
  
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <NativeBaseProvider theme={theme}>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </NativeBaseProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}