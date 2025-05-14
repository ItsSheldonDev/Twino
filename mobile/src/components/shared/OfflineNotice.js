// src/components/shared/OfflineNotice.js
import React from 'react';
import { Box, HStack, Text, Icon, Pressable } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useOffline } from '../../hooks/useOffline';
import syncManager from '../../utils/syncManager';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Composant affichant une notification lorsque l'appareil est hors ligne
 * et/ou a des opérations en attente de synchronisation
 */
const OfflineNotice = () => {
  const { isOffline, checkConnection } = useOffline();
  const [pendingCount, setPendingCount] = React.useState(0);
  
  // Récupérer les opérations en attente quand l'écran est actif
  useFocusEffect(
    React.useCallback(() => {
      const updatePendingCount = async () => {
        const count = await syncManager.countPendingOperations();
        setPendingCount(count);
      };
      
      updatePendingCount();
      
      // Mettre à jour toutes les 10 secondes
      const interval = setInterval(updatePendingCount, 10000);
      
      return () => clearInterval(interval);
    }, [])
  );
  
  // Gérer le clic sur la barre de notification
  const handlePress = async () => {
    if (isOffline) {
      // Vérifier à nouveau la connexion
      await checkConnection();
    } else if (pendingCount > 0) {
      // Forcer la synchronisation
      try {
        const results = await syncManager.syncAll();
        
        // Mettre à jour le compteur
        const count = await syncManager.countPendingOperations();
        setPendingCount(count);
      } catch (error) {
        console.error('Erreur lors de la synchronisation:', error);
      }
    }
  };
  
  // Ne rien afficher si tout est en ligne et synchronisé
  if (!isOffline && pendingCount === 0) {
    return null;
  }
  
  return (
    <Pressable onPress={handlePress}>
      <Box 
        bg={isOffline ? "red.500" : "orange.400"} 
        px={4} 
        py={2}
        justifyContent="center"
        alignItems="center"
      >
        <HStack space={2} alignItems="center">
          <Icon 
            as={MaterialIcons} 
            name={isOffline ? "wifi-off" : "sync"} 
            color="white" 
            size="sm" 
          />
          <Text color="white" fontWeight="medium">
            {isOffline 
              ? "Vous êtes hors ligne"
              : `${pendingCount} opération${pendingCount > 1 ? 's' : ''} en attente`
            }
          </Text>
        </HStack>
      </Box>
    </Pressable>
  );
};

export default OfflineNotice;