// src/components/transactions/TransactionItem.js
import React from 'react';
import { Box, HStack, Icon, Pressable, Text, VStack } from 'native-base';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Map des icônes par catégorie
const CATEGORY_ICONS = {
  'Alimentation': 'restaurant',
  'Transport': 'directions-car',
  'Logement': 'home',
  'Loisirs': 'sports-esports',
  'Shopping': 'shopping-bag',
  'Santé': 'medical-services',
  'Factures': 'receipt',
  'Abonnements': 'subscriptions',
  'Revenus': 'arrow-downward',
  'Épargne': 'savings',
  'Autres': 'more-horiz'
};

const TransactionItem = ({ transaction, onPress }) => {
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
    return format(new Date(dateString), 'd MMM', { locale: fr });
  };

  // Détermine si c'est une dépense ou un revenu
  const isExpense = transaction.amount < 0;
  
  // Détermine l'icône à afficher
  const getIcon = () => {
    if (transaction.category in CATEGORY_ICONS) {
      return CATEGORY_ICONS[transaction.category];
    }
    return isExpense ? 'arrow-upward' : 'arrow-downward';
  };
  
  // Détermine la couleur du montant et de l'icône
  const amountColor = isExpense ? 'red.600' : 'green.600';
  const iconColor = isExpense ? 'red.500' : 'green.500';
  const bgColor = isExpense ? 'red.50' : 'green.50';
  
  // Montant à afficher (valeur absolue)
  const displayAmount = formatCurrency(Math.abs(transaction.amount));

  return (
    <Pressable onPress={onPress}>
      <HStack space={3} alignItems="center" py={2}>
        {/* Icône de catégorie */}
        <Box p={2} bg={bgColor} borderRadius="full">
          <Icon 
            as={MaterialIcons} 
            name={getIcon()} 
            size="md" 
            color={iconColor} 
          />
        </Box>
        
        {/* Détails de la transaction */}
        <VStack flex={1}>
          <Text color="gray.800" fontWeight="medium" numberOfLines={1}>
            {transaction.description}
          </Text>
          <HStack space={1} alignItems="center">
            <Text fontSize="xs" color="gray.500">
              {formatDate(transaction.date)}
            </Text>
            
            {/* Badge de partage si transaction partagée */}
            {transaction.isShared && (
              <HStack space={0.5} alignItems="center" bg="blue.50" px={1} borderRadius="sm">
                <Icon 
                  as={MaterialCommunityIcons} 
                  name="account-multiple" 
                  size="xs" 
                  color="blue.500" 
                />
                <Text fontSize="2xs" color="blue.500">Partagé</Text>
              </HStack>
            )}
          </HStack>
        </VStack>
        
        {/* Montant */}
        <Text color={amountColor} fontWeight="bold">
          {displayAmount}
        </Text>
      </HStack>
    </Pressable>
  );
};

export default TransactionItem;