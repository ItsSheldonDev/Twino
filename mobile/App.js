import React from 'react';
import { NativeBaseProvider } from 'native-base';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation';
import { theme } from './src/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Créez une instance de QueryClient
const queryClient = new QueryClient();

export default function App() {
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