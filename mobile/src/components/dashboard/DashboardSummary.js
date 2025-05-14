// src/components/dashboard/DashboardSummary.js
import React from 'react';
import { Box, HStack, VStack, Text, Heading, Progress, Divider, Icon } from 'native-base';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const DashboardSummary = ({ data }) => {
  // Formatage des montants
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calcul du solde disponible (revenus - dépenses)
  const availableBalance = data.income - data.expenses;
  
  // Calcul de la progression (dépenses / revenus)
  const progressPercentage = Math.min(Math.round((data.expenses / data.income) * 100), 100);
  
  // Détermination de la couleur de progression
  let progressColor = "green.500";
  if (progressPercentage > 80) {
    progressColor = "red.500";
  } else if (progressPercentage > 60) {
    progressColor = "orange.500";
  }

  return (
    <Box bg="white" borderRadius="lg" shadow={1} p={4} mb={2}>
      <VStack space={4}>
        {/* Solde disponible */}
        <VStack space={1}>
          <Text color="gray.500" fontWeight="medium">Solde disponible ce mois</Text>
          <Heading size="xl" color={availableBalance >= 0 ? "green.600" : "red.600"}>
            {formatCurrency(availableBalance)}
          </Heading>
        </VStack>
        
        <Divider />
        
        {/* Progression dépenses / revenus */}
        <VStack space={2}>
          <HStack justifyContent="space-between">
            <Text color="gray.600" fontWeight="medium">Dépenses / Revenus</Text>
            <Text color="gray.600" fontWeight="bold">
              {progressPercentage}%
            </Text>
          </HStack>
          <Progress
            value={progressPercentage}
            size="sm"
            colorScheme={progressPercentage > 80 ? "red" : progressPercentage > 60 ? "orange" : "green"}
            bg="gray.200"
          />
          <HStack justifyContent="space-between">
            <Text color="gray.500" fontSize="xs">
              {formatCurrency(data.expenses)}
            </Text>
            <Text color="gray.500" fontSize="xs">
              {formatCurrency(data.income)}
            </Text>
          </HStack>
        </VStack>
        
        {/* Revenus et dépenses */}
        <HStack justifyContent="space-between" mt={2}>
          <VStack space={1} alignItems="center" w="48%">
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="arrow-downward" color="green.500" size="sm" />
              <Text color="gray.600">Revenus</Text>
            </HStack>
            <Text fontWeight="bold" fontSize="lg">{formatCurrency(data.income)}</Text>
          </VStack>
          
          <Divider orientation="vertical" />
          
          <VStack space={1} alignItems="center" w="48%">
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="arrow-upward" color="red.500" size="sm" />
              <Text color="gray.600">Dépenses</Text>
            </HStack>
            <Text fontWeight="bold" fontSize="lg">{formatCurrency(data.expenses)}</Text>
          </VStack>
        </HStack>
        
        {/* Épargne */}
        {data.savings && (
          <HStack bg="blue.50" p={3} borderRadius="md" alignItems="center" space={3}>
            <Icon as={MaterialCommunityIcons} name="piggy-bank" color="blue.500" size="md" />
            <VStack>
              <Text fontWeight="medium" color="gray.700">Épargne totale</Text>
              <Text fontWeight="bold" fontSize="md" color="blue.600">
                {formatCurrency(data.savings)}
              </Text>
            </VStack>
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default DashboardSummary;