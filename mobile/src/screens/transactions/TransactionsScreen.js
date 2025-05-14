// src/screens/transactions/TransactionsScreen.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  FlatList,
  Text,
  Heading,
  VStack,
  HStack,
  Icon,
  Input,
  IconButton,
  Divider,
  Menu,
  Pressable,
  Select,
  Spinner,
  useColorModeValue,
  useToast,
  Center,
  Button,
  ScrollView,
} from 'native-base';
import { RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { useDebounce } from '../../hooks/useDebounce';
import apiClient from '../../api/client';
import TransactionItem from '../../components/transactions/TransactionItem';
import { format, subMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const TransactionsScreen = ({ navigation }) => {
  // État pour les filtres
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    category: '',
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    minAmount: '',
    maxAmount: '',
    isShared: '',
    search: '',
  });
  
  // État pour le suivi du chargement
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Debounce pour la recherche
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Récupération des transactions
  const {
    data: transactionsData,
    isLoading,
    isFetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useQuery(
    ['transactions', { ...filters, search: debouncedSearch }],
    () => fetchTransactions(filters),
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
      keepPreviousData: true,
    }
  );
  
  // Récupération des catégories
  const { data: categories } = useQuery(
    ['transaction-categories'],
    () => apiClient.get('/transactions/categories').then(res => res.data),
    {
      staleTime: 1000 * 60 * 60, // 1 heure
    }
  );
  
  // Fonction pour récupérer les transactions
  const fetchTransactions = async (params) => {
    const response = await apiClient.get('/transactions', { params });
    return response.data;
  };
  
  // Gestion du rafraîchissement
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  
  // Chargement de la page suivante
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
      fetchNextPage();
    }
  };
  
  // Reset des filtres
  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      category: '',
      startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      minAmount: '',
      maxAmount: '',
      isShared: '',
      search: '',
    });
  };
  
  // Mise à jour des filtres
  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, page: 1, [key]: value }));
  };
  
  // Gestion des périodes prédéfinies
  const handlePeriodChange = (period) => {
    let startDate = '';
    const endDate = format(new Date(), 'yyyy-MM-dd');
    
    switch (period) {
      case 'week':
        startDate = format(subMonths(new Date(), 0.25), 'yyyy-MM-dd');
        break;
      case 'month':
        startDate = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
        break;
      case 'quarter':
        startDate = format(subMonths(new Date(), 3), 'yyyy-MM-dd');
        break;
      case 'year':
        startDate = format(subMonths(new Date(), 12), 'yyyy-MM-dd');
        break;
      default:
        startDate = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
    }
    
    setFilters((prev) => ({ ...prev, page: 1, startDate, endDate }));
  };
  
  // Formater les montants pour l'affichage
  const formatCurrency = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Vérifier si des filtres sont actifs
  const hasActiveFilters = () => {
    return (
      filters.category !== '' ||
      filters.minAmount !== '' ||
      filters.maxAmount !== '' ||
      filters.isShared !== '' ||
      filters.search !== '' ||
      filters.startDate !== format(subMonths(new Date(), 1), 'yyyy-MM-dd') ||
      filters.endDate !== format(new Date(), 'yyyy-MM-dd')
    );
  };
  
  // Style couleurs
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Rendu de l'élément de fin de liste
  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <Center py={4}>
          <Spinner size="sm" color="primary.500" />
        </Center>
      );
    }
    
    if (!hasNextPage && transactionsData?.length > 0) {
      return (
        <Center py={4}>
          <Text color="gray.500">Plus aucune transaction</Text>
        </Center>
      );
    }
    
    return null;
  };
  
  return (
    <Box flex={1} bg="gray.50" safeAreaTop>
      {/* En-tête */}
      <VStack space={2} p={4} bg="primary.500">
        <HStack justifyContent="space-between" alignItems="center">
          <Heading color="white" size="md" fontWeight="600">
            Transactions
          </Heading>
          <IconButton
            icon={<Icon as={MaterialIcons} name="add" size="sm" color="white" />}
            onPress={() => navigation.navigate('AddTransaction')}
            variant="ghost"
            _pressed={{ bg: 'primary.600' }}
          />
        </HStack>
        
        {/* Barre de recherche */}
        <Input
          placeholder="Rechercher"
          bg="white"
          value={filters.search}
          onChangeText={(value) => updateFilter('search', value)}
          InputLeftElement={
            <Icon
              as={MaterialIcons}
              name="search"
              size={5}
              ml="2"
              color="muted.400"
            />
          }
          InputRightElement={
            filters.search ? (
              <IconButton
                icon={<Icon as={MaterialIcons} name="close" size="xs" color="muted.400" />}
                onPress={() => updateFilter('search', '')}
                variant="ghost"
              />
            ) : null
          }
        />
        
        {/* Boutons de période et filtres */}
        <HStack space={2} mt={1}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Button
              size="sm"
              variant={filters.startDate === format(subMonths(new Date(), 0.25), 'yyyy-MM-dd') ? "solid" : "outline"}
              bg={filters.startDate === format(subMonths(new Date(), 0.25), 'yyyy-MM-dd') ? "white" : "transparent"}
              _text={{ 
                color: filters.startDate === format(subMonths(new Date(), 0.25), 'yyyy-MM-dd') ? "primary.500" : "white" 
              }}
              borderColor="white"
              onPress={() => handlePeriodChange('week')}
              mr={2}
            >
              7 jours
            </Button>
            
            <Button
              size="sm"
              variant={filters.startDate === format(subMonths(new Date(), 1), 'yyyy-MM-dd') ? "solid" : "outline"}
              bg={filters.startDate === format(subMonths(new Date(), 1), 'yyyy-MM-dd') ? "white" : "transparent"}
              _text={{ 
                color: filters.startDate === format(subMonths(new Date(), 1), 'yyyy-MM-dd') ? "primary.500" : "white" 
              }}
              borderColor="white"
              onPress={() => handlePeriodChange('month')}
              mr={2}
            >
              30 jours
            </Button>
            
            <Button
              size="sm"
              variant={filters.startDate === format(subMonths(new Date(), 3), 'yyyy-MM-dd') ? "solid" : "outline"}
              bg={filters.startDate === format(subMonths(new Date(), 3), 'yyyy-MM-dd') ? "white" : "transparent"}
              _text={{ 
                color: filters.startDate === format(subMonths(new Date(), 3), 'yyyy-MM-dd') ? "primary.500" : "white" 
              }}
              borderColor="white"
              onPress={() => handlePeriodChange('quarter')}
              mr={2}
            >
              3 mois
            </Button>
            
            <Button
              size="sm"
              variant={filters.startDate === format(subMonths(new Date(), 12), 'yyyy-MM-dd') ? "solid" : "outline"}
              bg={filters.startDate === format(subMonths(new Date(), 12), 'yyyy-MM-dd') ? "white" : "transparent"}
              _text={{ 
                color: filters.startDate === format(subMonths(new Date(), 12), 'yyyy-MM-dd') ? "primary.500" : "white" 
              }}
              borderColor="white"
              onPress={() => handlePeriodChange('year')}
              mr={2}
            >
              1 an
            </Button>
          </ScrollView>
          
          <Button
            size="sm"
            variant="outline"
            borderColor="white"
            _text={{ color: "white" }}
            leftIcon={<Icon as={MaterialIcons} name="filter-list" size="xs" color="white" />}
            onPress={() => setShowFilters(!showFilters)}
          >
            Filtres
          </Button>
        </HStack>
        
        {/* Panneau de filtres avancés */}
        {showFilters && (
          <VStack space={2} mt={2} bg="white" p={3} borderRadius="md">
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="bold">Filtres avancés</Text>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="primary"
                onPress={resetFilters}
                disabled={!hasActiveFilters()}
              >
                Réinitialiser
              </Button>
            </HStack>
            
            <Divider my={1} />
            
            {/* Filtre par catégorie */}
            <Select
              placeholder="Toutes les catégories"
              selectedValue={filters.category}
              onValueChange={(value) => updateFilter('category', value)}
              accessibilityLabel="Choisir une catégorie"
              variant="outline"
              size="sm"
            >
              {categories?.map((category) => (
                <Select.Item key={category} label={category} value={category} />
              ))}
            </Select>
            
            {/* Filtres de montant */}
            <HStack space={2}>
              <Input
                flex={1}
                placeholder="Montant min"
                size="sm"
                keyboardType="numeric"
                value={filters.minAmount}
                onChangeText={(value) => updateFilter('minAmount', value)}
              />
              <Input
                flex={1}
                placeholder="Montant max"
                size="sm"
                keyboardType="numeric"
                value={filters.maxAmount}
                onChangeText={(value) => updateFilter('maxAmount', value)}
              />
            </HStack>
            
            {/* Filtre partagé */}
            <Select
              placeholder="Partagées ou non"
              selectedValue={filters.isShared}
              onValueChange={(value) => updateFilter('isShared', value)}
              accessibilityLabel="Filtrer les dépenses partagées"
              variant="outline"
              size="sm"
            >
              <Select.Item label="Toutes les transactions" value="" />
              <Select.Item label="Transactions partagées" value="true" />
              <Select.Item label="Transactions non partagées" value="false" />
            </Select>
          </VStack>
        )}
      </VStack>
      
      {/* Liste des transactions */}
      {isLoading ? (
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text mt={2} color="gray.500">Chargement des transactions...</Text>
        </Center>
      ) : transactionsData?.length === 0 ? (
        <Center flex={1} p={4}>
          <Icon as={MaterialIcons} name="receipt-long" size="4xl" color="gray.300" />
          <Text mt={4} fontSize="lg" fontWeight="medium" color="gray.500">
            Aucune transaction trouvée
          </Text>
          <Text textAlign="center" color="gray.400">
            {hasActiveFilters() 
              ? "Essayez de modifier vos filtres pour voir plus de résultats."
              : "Commencez à enregistrer vos transactions ou connectez votre compte bancaire."}
          </Text>
          {hasActiveFilters() && (
            <Button
              mt={4}
              colorScheme="primary"
              leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
              onPress={resetFilters}
            >
              Réinitialiser les filtres
            </Button>
          )}
        </Center>
      ) : (
        <FlatList
          data={transactionsData}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={() => navigation.navigate('TransactionDetail', { id: item.id })}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ 
            padding: 16,
            paddingBottom: 80, // Espace pour le bottom tab
          }}
          ItemSeparatorComponent={() => <Divider my={2} bg={borderColor} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
        />
      )}
    </Box>
  );
};

export default TransactionsScreen;