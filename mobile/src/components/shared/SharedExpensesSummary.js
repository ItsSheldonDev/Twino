// src/components/shared/SharedExpensesSummary.js
import React from 'react';
import { Box, Center, HStack, Icon, Text, VStack, Avatar, Divider } from 'native-base';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const SharedExpensesSummary = ({ data }) => {
  // Formatage des montants
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Détermine le statut du solde
  const getBalanceStatus = (balance) => {
    if (balance > 0) {
      return {
        text: 'Votre partenaire vous doit',
        color: 'green.600',
        icon: 'arrow-downward'
      };
    } else if (balance < 0) {
      return {
        text: 'Vous devez à votre partenaire',
        color: 'red.600',
        icon: 'arrow-upward'
      };
    } else {
      return {
        text: 'Solde équilibré',
        color: 'blue.600',
        icon: 'thumbs-up-down'
      };
    }
  };

  // Récupération du statut du solde
  const balanceStatus = getBalanceStatus(data.balance);
  
  // Montant à afficher (valeur absolue)
  const displayAmount = formatCurrency(Math.abs(data.balance));
  
  // Pourcentage d'avancement du règlement
  const settlementProgress = data.pendingAmount > 0 
    ? Math.floor((data.settledAmount / (data.settledAmount + data.pendingAmount)) * 100)
    : 100;

  return (
    <VStack space={3}>
      {/* Solde actuel */}
      <HStack space={3} alignItems="center">
        <Avatar.Group _avatar={{ size: "md" }}>
          <Avatar 
            bg="primary.500"
            source={{ uri: data.userPhoto || 'https://via.placeholder.com/100' }}
          >
            {data.userName?.charAt(0) || 'U'}
          </Avatar>
          <Avatar 
            bg="amber.500"
            source={{ uri: data.partnerPhoto || 'https://via.placeholder.com/100' }}
          >
            {data.partnerName?.charAt(0) || 'P'}
          </Avatar>
        </Avatar.Group>
        
        <VStack flex={1}>
          <Text color="gray.600" fontSize="sm">
            {balanceStatus.text}
          </Text>
          <HStack alignItems="center" space={1}>
            <Icon 
              as={MaterialIcons} 
              name={balanceStatus.icon} 
              color={balanceStatus.color} 
              size="sm"
            />
            <Text color={balanceStatus.color} fontWeight="bold" fontSize="lg">
              {displayAmount}
            </Text>
          </HStack>
        </VStack>
      </HStack>
      
      <Divider />
      
      {/* Statistiques des dépenses partagées */}
      <HStack justifyContent="space-between">
        <VStack alignItems="center" w="30%">
          <Text color="gray.500" fontSize="xs">
            Dépenses réglées
          </Text>
          <HStack alignItems="center" space={0.5}>
            <Icon 
              as={MaterialIcons} 
              name="check-circle" 
              color="green.500" 
              size="xs"
            />
            <Text fontWeight="bold">
              {formatCurrency(data.settledAmount)}
            </Text>
          </HStack>
        </VStack>
        
        <VStack alignItems="center" w="30%">
          <Text color="gray.500" fontSize="xs">
            Dépenses en attente
          </Text>
          <HStack alignItems="center" space={0.5}>
            <Icon 
              as={MaterialIcons} 
              name="pending" 
              color="amber.500" 
              size="xs"
            />
            <Text fontWeight="bold">
              {formatCurrency(data.pendingAmount)}
            </Text>
          </HStack>
        </VStack>
        
        <VStack alignItems="center" w="30%">
          <Text color="gray.500" fontSize="xs">
            Total ce mois
          </Text>
          <Text fontWeight="bold">
            {formatCurrency(data.totalAmount)}
          </Text>
        </VStack>
      </HStack>
      
      {/* Ratio de règlement */}
      {data.pendingAmount > 0 && (
        <Center pt={1}>
          <Text fontSize="xs" color="blue.600" fontWeight="medium">
            {settlementProgress}% des dépenses partagées sont réglées
          </Text>
        </Center>
      )}
    </VStack>
  );
};

export default SharedExpensesSummary;