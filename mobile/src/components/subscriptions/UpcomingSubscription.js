// src/components/subscriptions/UpcomingSubscription.js
import React from 'react';
import { Box, HStack, Icon, Progress, Text, VStack } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

// Map des couleurs par catégorie
const CATEGORY_COLORS = {
  'Streaming': 'red',
  'Téléphone': 'blue',
  'Internet': 'purple',
  'Électricité': 'yellow',
  'Eau': 'cyan',
  'Assurance': 'green',
  'Loyer': 'orange',
  'Fitness': 'pink',
  'Services': 'indigo',
  'Autres': 'gray'
};

const UpcomingSubscription = ({ subscription }) => {
  // Formatage des montants
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'd MMMM', { locale: fr });
  };
  
  // Calcul des jours restants
  const daysRemaining = differenceInDays(
    new Date(subscription.dueDate),
    new Date()
  );
  
  // Texte à afficher selon les jours restants
  const getDaysText = () => {
    if (daysRemaining === 0) return 'Aujourd\'hui';
    if (daysRemaining === 1) return 'Demain';
    return `Dans ${daysRemaining} jours`;
  };
  
  // Détermine la couleur d'alerte selon les jours restants
  const getStatusColor = () => {
    if (daysRemaining <= 3) return 'red';
    if (daysRemaining <= 7) return 'orange';
    return 'green';
  };
  
  // Détermine la couleur de catégorie
  const categoryColor = 
    subscription.category in CATEGORY_COLORS 
      ? CATEGORY_COLORS[subscription.category] 
      : 'gray';
  
  // Calcul du pourcentage pour la barre de progression
  // On considère qu'un mois a 30 jours en moyenne
  const progress = Math.min(100, Math.max(0, (30 - daysRemaining) / 30 * 100));

  return (
    <Box 
      p={3} 
      borderRadius="md" 
      borderWidth={1} 
      borderColor="gray.200"
      borderLeftWidth={4}
      borderLeftColor={`${categoryColor}.500`}
    >
      <VStack space={2}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontWeight="bold" color="gray.800">
            {subscription.name}
          </Text>
          <Text 
            fontWeight="bold" 
            color={`${getStatusColor()}.600`}
            fontSize="sm"
          >
            {getDaysText()}
          </Text>
        </HStack>
        
        <HStack justifyContent="space-between" alignItems="center">
          <Text color="gray.600" fontSize="sm">
            {subscription.category}
          </Text>
          <Text color="gray.700" fontWeight="medium">
            {formatCurrency(subscription.amount)}
          </Text>
        </HStack>
        
        <HStack space={2} alignItems="center">
          <Icon 
            as={MaterialIcons} 
            name="event" 
            size="xs" 
            color="gray.500" 
          />
          <Text color="gray.500" fontSize="xs">
            {formatDate(subscription.dueDate)}
          </Text>
          
          {/* Badge de partage si abonnement partagé */}
          {subscription.isShared && (
            <HStack 
              ml="auto" 
              space={0.5} 
              alignItems="center" 
              bg="blue.50" 
              px={1} 
              borderRadius="sm"
            >
              <Icon 
                as={MaterialIcons} 
                name="people" 
                size="xs" 
                color="blue.500" 
              />
              <Text fontSize="2xs" color="blue.500">
                Partagé {subscription.sharingRatio}%
              </Text>
            </HStack>
          )}
        </HStack>
        
        {/* Barre de progression */}
        <Progress 
          value={progress} 
          colorScheme={getStatusColor()} 
          size="xs" 
          bg="gray.200" 
        />
      </VStack>
    </Box>
  );
};

export default UpcomingSubscription;