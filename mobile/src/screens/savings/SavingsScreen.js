// src/screens/savings/SavingsScreen.js
import React, { useState } from 'react';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Icon,
  IconButton,
  Divider,
  Spinner,
  useColorModeValue,
  useToast,
  Center,
  Button,
  FlatList,
  Pressable,
  Progress,
  Fab,
  Menu,
  Badge,
} from 'native-base';
import { RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { format, addMonths, differenceInMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

const SavingsScreen = ({ navigation }) => {
  // États
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' ou 'goals'
  
  // Styles
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tabBg = useColorModeValue('gray.50', 'gray.700');
  
  // Récupération des comptes d'épargne
  const {
    data: accounts,
    isLoading: loadingAccounts,
    refetch: refetchAccounts,
  } = useQuery(
    ['savings-accounts'],
    () => apiClient.get('/savings/accounts').then(res => res.data),
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
  
  // Récupération des objectifs d'épargne
  const {
    data: goals,
    isLoading: loadingGoals,
    refetch: refetchGoals,
  } = useQuery(
    ['savings-goals'],
    () => apiClient.get('/savings/goals').then(res => res.data),
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
  
  // Récupération du résumé d'épargne
  const {
    data: summary,
    isLoading: loadingSummary,
    refetch: refetchSummary,
  } = useQuery(
    ['savings-summary'],
    () => apiClient.get('/savings/summary').then(res => res.data),
    {
      staleTime: 1000 * 60 * 15, // 15 minutes
    }
  );
  
  // Formatage des montants
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  // Gestion du rafraîchissement
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchAccounts(),
      refetchGoals(),
      refetchSummary()
    ]);
    setRefreshing(false);
  }, [refetchAccounts, refetchGoals, refetchSummary]);
  
  // Calcul du temps restant pour atteindre un objectif
  const calculateTimeRemaining = (goal) => {
    if (!goal.targetDate) return null;
    
    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    const monthsRemaining = differenceInMonths(targetDate, now);
    
    if (monthsRemaining <= 0) return 'Échéance dépassée';
    if (monthsRemaining === 1) return '1 mois restant';
    return `${monthsRemaining} mois restants`;
  };
  
  // Calcul de la progression vers un objectif
  const calculateProgress = (goal) => {
    if (goal.currentAmount === 0 || goal.targetAmount === 0) return 0;
    
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    return Math.min(100, Math.max(0, progress));
  };
  
  // Rendu du résumé d'épargne
  const renderSummary = () => {
    if (!summary) return null;
    
    return (
      <Box bg={bgColor} p={4} borderRadius="lg" shadow={1} mb={4}>
        <HStack justifyContent="space-between" alignItems="center" mb={2}>
          <Text fontWeight="bold" fontSize="md">
            Total épargne
          </Text>
          <Text fontWeight="bold" fontSize="xl" color="blue.600">
            {formatCurrency(summary.totalSavings)}
          </Text>
        </HStack>
        
        <Divider my={2} />
        
        <HStack justifyContent="space-between">
          <VStack space={0.5} alignItems="center" w="48%">
            <Text color="gray.600" fontSize="sm">
              Comptes d'épargne
            </Text>
            <Text fontWeight="medium" fontSize="md">
              {formatCurrency(summary.totalAccountsBalance)}
            </Text>
            <Text color="gray.400" fontSize="xs">
              {summary.accountsCount} comptes
            </Text>
          </VStack>
          
          <Divider orientation="vertical" />
          
          <VStack space={0.5} alignItems="center" w="48%">
            <Text color="gray.600" fontSize="sm">
              Progression objectifs
            </Text>
            <HStack alignItems="center" space={1}>
              <Text fontWeight="medium" fontSize="md">
                {summary.averageGoalProgress}%
              </Text>
              <Icon 
                as={MaterialIcons} 
                name="trending-up" 
                size="xs" 
                color="green.500" 
              />
            </HStack>
            <Text color="gray.400" fontSize="xs">
              {summary.goalsCount} objectifs
            </Text>
          </VStack>
        </HStack>
      </Box>
    );
  };
  
  // Rendu d'un compte d'épargne
  const renderAccountItem = ({ item }) => {
    return (
      <Pressable 
        onPress={() => navigation.navigate('SavingsAccountDetail', { id: item.id })}
      >
        <Box
          p={4}
          bg={bgColor}
          borderRadius="lg"
          shadow={1}
          mb={3}
        >
          <HStack justifyContent="space-between" alignItems="center">
            <HStack space={3} alignItems="center">
              <Center 
                bg="blue.100" 
                p={2} 
                borderRadius="full"
              >
                <Icon 
                  as={MaterialCommunityIcons} 
                  name="piggy-bank" 
                  size="md" 
                  color="blue.600" 
                />
              </Center>
              
              <VStack space={0.5}>
                <Text fontWeight="bold" fontSize="md">
                  {item.name}
                </Text>
                <Text color="gray.500" fontSize="sm">
                  {item.institution}
                </Text>
                {item.interestRate > 0 && (
                  <Badge colorScheme="green" variant="subtle" rounded="md">
                    {item.interestRate}% d'intérêts
                  </Badge>
                )}
              </VStack>
            </HStack>
            
            <VStack alignItems="flex-end">
              <Text fontWeight="bold" fontSize="lg" color="blue.600">
                {formatCurrency(item.balance)}
              </Text>
              {item.isShared && (
                <Badge colorScheme="indigo" variant="outline" rounded="md" size="sm">
                  Partagé
                </Badge>
              )}
            </VStack>
          </HStack>
        </Box>
      </Pressable>
    );
  };
  
  // Rendu d'un objectif d'épargne
  const renderGoalItem = ({ item }) => {
    const progress = calculateProgress(item);
    const timeRemaining = calculateTimeRemaining(item);
    
    return (
      <Pressable 
        onPress={() => navigation.navigate('SavingsGoalDetail', { id: item.id })}
      >
        <Box
          p={4}
          bg={bgColor}
          borderRadius="lg"
          shadow={1}
          mb={3}
        >
          <VStack space={2}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="bold" fontSize="md">
                {item.name}
              </Text>
              <Badge 
                colorScheme={progress >= 100 ? "green" : "blue"} 
                variant="subtle" 
                rounded="md"
              >
                {progress >= 100 ? "Objectif atteint" : timeRemaining}
              </Badge>
            </HStack>
            
            <HStack justifyContent="space-between" alignItems="center">
              <Text color="gray.500" fontSize="sm">
                {formatCurrency(item.currentAmount)} / {formatCurrency(item.targetAmount)}
              </Text>
              <Text fontWeight="medium" color="blue.600">
                {Math.round(progress)}%
              </Text>
            </HStack>
            
            <Progress 
              value={progress} 
              colorScheme="blue" 
              size="sm" 
            />
            
            {item.isShared && (
              <HStack alignItems="center" space={1} mt={1}>
                <Icon 
                  as={MaterialIcons} 
                  name="people" 
                  size="xs" 
                  color="indigo.500" 
                />
                <Text fontSize="xs" color="indigo.500">
                  Objectif partagé
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>
      </Pressable>
    );
  };
  
  const isLoading = loadingAccounts || loadingGoals || loadingSummary;
  
  return (
    <Box flex={1} bg="gray.50" safeAreaTop>
      {/* En-tête */}
      <VStack p={4} bg="primary.500">
        <HStack justifyContent="space-between" alignItems="center">
          <Heading color="white" size="md" fontWeight="600">
            Épargne
          </Heading>
          <Menu
            placement="bottom right"
            trigger={(triggerProps) => (
              <IconButton
                {...triggerProps}
                icon={<Icon as={MaterialIcons} name="more-vert" size="sm" color="white" />}
                variant="ghost"
                _pressed={{ bg: 'primary.600' }}
              />
            )}
          >
            <Menu.Item 
              onPress={() => navigation.navigate('SavingsForecast')}
              leftIcon={<Icon as={MaterialIcons} name="insert-chart" size="sm" />}
            >
              Prévisions d'épargne
            </Menu.Item>
            <Menu.Item 
              onPress={() => navigation.navigate('SavingsCalculator')}
              leftIcon={<Icon as={MaterialIcons} name="calculate" size="sm" />}
            >
              Calculateur d'épargne
            </Menu.Item>
          </Menu>
        </HStack>
      </VStack>
      
      {/* Tabs */}
      <HStack bg={tabBg} p={1} space={1} justifyContent="center">
        <Button
          size="sm"
          flex={1}
          variant={activeTab === 'accounts' ? 'solid' : 'ghost'}
          colorScheme="primary"
          onPress={() => setActiveTab('accounts')}
        >
          Comptes
        </Button>
        <Button
          size="sm"
          flex={1}
          variant={activeTab === 'goals' ? 'solid' : 'ghost'}
          colorScheme="primary"
          onPress={() => setActiveTab('goals')}
        >
          Objectifs
        </Button>
      </HStack>
      
      {isLoading ? (
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text mt={2} color="gray.500">
            Chargement de vos {activeTab === 'accounts' ? 'comptes' : 'objectifs'}...
          </Text>
        </Center>
      ) : (
        <FlatList
          data={activeTab === 'accounts' ? accounts : goals}
          renderItem={activeTab === 'accounts' ? renderAccountItem : renderGoalItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 80, // Espace pour le bottom tab
          }}
          ListHeaderComponent={renderSummary}
          ListEmptyComponent={() => (
            <Center p={10}>
              <Icon 
                as={MaterialIcons} 
                name={activeTab === 'accounts' ? "account-balance" : "flag"} 
                size="4xl" 
                color="gray.300" 
              />
              <Text mt={4} fontSize="lg" fontWeight="medium" color="gray.500">
                Aucun {activeTab === 'accounts' ? 'compte d\'épargne' : 'objectif'} trouvé
              </Text>
              <Text textAlign="center" color="gray.400">
                {activeTab === 'accounts' 
                  ? "Ajoutez vos comptes d'épargne pour suivre leur évolution."
                  : "Définissez des objectifs d'épargne pour atteindre vos rêves."}
              </Text>
              <Button
                mt={4}
                colorScheme="primary"
                leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
                onPress={() => navigation.navigate(
                  activeTab === 'accounts' ? 'AddSavingsAccount' : 'AddSavingsGoal'
                )}
              >
                Ajouter un {activeTab === 'accounts' ? 'compte' : 'objectif'}
              </Button>
            </Center>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      
      {/* Bouton d'ajout */}
      <Fab
        position="absolute"
        size="sm"
        icon={<Icon as={MaterialIcons} name="add" size="sm" color="white" />}
        colorScheme="primary"
        renderInPortal={false}
        shadow={2}
        right={4}
        bottom={4}
        onPress={() => navigation.navigate(
          activeTab === 'accounts' ? 'AddSavingsAccount' : 'AddSavingsGoal'
        )}
      />
    </Box>
  );
};

export default SavingsScreen;