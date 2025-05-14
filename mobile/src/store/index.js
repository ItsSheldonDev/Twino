import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';
import authReducer from './authSlice';

// Configuration de Redux Persist
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Seules les données auth seront persistées
};

// Combiner tous les reducers
const rootReducer = combineReducers({
  auth: authReducer,
  // Ajoutez d'autres reducers ici
});

// Créer un reducer persistant
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configurer le store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Créer le persistor
export const persistor = persistStore(store);