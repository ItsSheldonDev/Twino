// src/screens/dashboard/DashboardScreen.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  FlatList,
  Heading,
  HStack,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
  Icon,
} from 'native-base';
import { RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DashboardSummary from '../../components/dashboard/DashboardSummary';
import ExpensesChart from '../../components/dashboard/ExpensesChart';
import TransactionItem from '../../components/transactions/TransactionItem';
import UpcomingSubscription from '../../components/subscriptions/UpcomingSubscription';
import SharedExpensesSummary from '../../components/shared/SharedExpensesSummary';

const DashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  
  // Style couleurs
  const bgCard = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Récupération des données du tableau de bord
  const { data: dashboardData, isLoading: loadingDashboard, refetch: refetchDashboard } = useQuery(
    ['dashboard-summary'],
    () => apiClient.get('/dashboard/summary').then(res => res.data),
    { staleTime: 1000 * 60 * 5 } // 5 minutes
  );
  
  // Récupération des dernières transactions
  const { data: latestTransactions, isLoading: loadingTransactions, refetch: refetchTransactions } = useQuery(
    ['latest-transactions'],
    () => apiClient.get('/transactions/latest', { params: { limit: 5 } }).then(res => res.data),
    { staleTime: 1000 * 60 * 5 } // 5 minutes
  );
  
  // Récupération des prochains abonnements
  const { data: upcomingSubscriptions, isLoading: loadingSubscriptions, refetch: refetchSubscriptions } = useQuery(
    ['upcoming-subscriptions'],
    () => apiClient.get('/subscriptions/upcoming', { params: { months: 1 } }).then(res => res.data),
    { staleTime: 1000 * 60 * 60 } // 1 heure
  );
  
  // Récupération des soldes partagés
  const { data: sharedBalance, isLoading: loadingShared, refetch: refetchShared } = useQuery(
    ['shared-balance'],
    () => apiClient.get('/shared/balance').then(res => res.data),
    { staleTime: 1000 * 60 * 15 } // 15 minutes
  );
  
  // Gestion du rafraîchissement
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchDashboard(),
      refetchTransactions(),
      refetchSubscriptions(),
      refetchShared()
    ]);
    setRefreshing(false);
  }, []);
  
  // Formatage de la date
  const formattedDate = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });
  
  // Calcul des données pour les sections
  const isLoading = loadingDashboard || loadingTransactions || loadingSubscriptions || loadingShared;
  const hasUpcomingSubscriptions = upcomingSubscriptions?.length > 0;
  const hasTransactions = latestTransactions?.length > 0;
  
  return (
    <Box flex={1} bg="gray.50" safeAreaTop>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* En-tête */}
        <VStack p={4} space={1} bg="primary.500">
          <Heading color="white" size="md" fontWeight="600">
            Tableau de bord
          </Heading>
          <Text color="white" fontWeight="medium">
            {formattedDate}
          </Text>
        </VStack>
        
        {isLoading ? (
          <Box flex={1} justifyContent="center" alignItems="center" py={10}>
            <Spinner size="lg" color="primary.500" />
            <Text mt={2} color="gray.500">Chargement des données...</Text>
          </Box>
        ) : (
          <VStack space={4} p={4}>
            {/* Résumé financier */}
            {dashboardData && <DashboardSummary data={dashboardData} />}
            
            {/* Dépenses partagées */}
            {sharedBalance && (
              <Box bg={bgCard} borderRadius="lg" shadow={1} p={4}>
                <HStack justifyContent="space-between" alignItems="center" mb={2}>
                  <Heading size="sm">Dépenses partagées</Heading>
                  <Pressable onPress={() => navigation.navigate('Shared')}>
                    <Text color="primary.500" fontWeight="semibold">Voir tout</Text>
                  </Pressable>
                </HStack>
                <SharedExpensesSummary data={sharedBalance} />
              </Box>
            )}
            
            {/* Répartition des dépenses */}
            {dashboardData?.expenses && (
              <Box bg={bgCard} borderRadius="lg" shadow={1} p={4} mb={2}>
                <HStack justifyContent="space-between" alignItems="center" mb={2}>
                  <Heading size="sm">Répartition des dépenses</Heading>
                  <Icon 
                    as={MaterialIcons} 
                    name="pie-chart" 
                    color="primary.500" 
                    size="md" 
                  />
                </HStack>
                <ExpensesChart data={dashboardData.expenses} />
              </Box>
            )}
            
            {/* Prochains abonnements */}
            <Box bg={bgCard} borderRadius="lg" shadow={1} p={4}>
              <HStack justifyContent="space-between" alignItems="center" mb={2}>
                <Heading size="sm">Prochains abonnements</Heading>
                <Pressable onPress={() => navigation.navigate('Subscriptions')}>
                  <Text color="primary.500" fontWeight="semibold">Voir tout</Text>
                </Pressable>
              </HStack>
              
              {!hasUpcomingSubscriptions ? (
                <Text color="muted.500" textAlign="center" py={2}>
                  Aucun abonnement à venir
                </Text>
              ) : (
                <VStack space={2}>
                  {upcomingSubscriptions.slice(0, 3).map((sub) => (
                    <UpcomingSubscription key={sub.id} subscription={sub} />
                  ))}
                </VStack>
              )}
            </Box>
            
            {/* Dernières transactions */}
            <Box bg={bgCard} borderRadius="lg" shadow={1} p={4}>
              <HStack justifyContent="space-between" alignItems="center" mb={2}>
                <Heading size="sm">Dernières transactions</Heading>
                <Pressable onPress={() => navigation.navigate('Transactions')}>
                  <Text color="primary.500" fontWeight="semibold">Voir tout</Text>
                </Pressable>
              </HStack>
              
              {!hasTransactions ? (
                <Text color="muted.500" textAlign="center" py={2}>
                  Aucune transaction récente
                </Text>
              ) : (
                <VStack space={2} divider={{ bgColor: borderColor }}>
                  {latestTransactions.map((transaction) => (
                    <TransactionItem 
                      key={transaction.id} 
                      transaction={transaction} 
                      onPress={() => navigation.navigate('TransactionDetail', { id: transaction.id })}
                    />
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        )}
      </ScrollView>
    </Box>
  );
};

export default DashboardScreen;