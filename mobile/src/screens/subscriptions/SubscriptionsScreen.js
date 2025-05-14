// src/screens/subscriptions/SubscriptionsScreen.js
import React, { useState } from 'react';
import {
  Box,
  FlatList,
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
  Fab,
  Menu,
  Pressable,
  Badge,
} from 'native-base';
import { RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SubscriptionsScreen = ({ navigation }) => {
  // États
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'shared'
  
  // Styles
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tabBg = useColorModeValue('gray.50', 'gray.700');
  
  // Récupération des abonnements
  const {
    data: subscriptions,
    isLoading,
    refetch,
  } = useQuery(
    ['subscriptions'],
    () => apiClient.get('/subscriptions').then(res => res.data),
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
  
  // Récupération du résumé mensuel
  const {
    data: summary,
    isLoading: loadingSummary,
    refetch: refetchSummary,
  } = useQuery(
    ['subscriptions-summary'],
    () => apiClient.get('/subscriptions/summary').then(res => res.data),
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
  
  // Formatage des dates
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'd MMMM', { locale: fr });
  };
  
  // Gestion du rafraîchissement
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchSummary()]);
    setRefreshing(false);
  }, [refetch, refetchSummary]);
  
  // Filtrage des abonnements
  const filteredSubscriptions = React.useMemo(() => {
    if (!subscriptions) return [];
    
    switch (filter) {
      case 'active':
        return subscriptions.filter(sub => sub.isActive);
      case 'shared':
        return subscriptions.filter(sub => sub.isShared);
      default:
        return subscriptions;
    }
  }, [subscriptions, filter]);
  
  // Rendu d'un abonnement
  const renderSubscriptionItem = ({ item }) => {
    // Détermine la couleur en fonction de la catégorie
    const getCategoryColor = (category) => {
      const colors = {
        'Streaming': 'red',
        'Téléphone': 'blue',
        'Internet': 'purple',
        'Électricité': 'yellow',
        'Eau': 'cyan',
        'Assurance': 'green',
        'Loyer': 'orange',
        'Fitness': 'pink',
        'Services': 'indigo',
        'Autres': 'gray',
      };
      
      return colors[category] || 'gray';
    };
    
    const categoryColor = getCategoryColor(item.category);
    
    return (
      <Pressable 
        onPress={() => navigation.navigate('SubscriptionDetail', { id: item.id })}
      >
        <Box
          p={4}
          bg={bgColor}
          borderRadius="lg"
          borderLeftWidth={4}
          borderLeftColor={`${categoryColor}.500`}
          shadow={1}
          mb={3}
        >
          <HStack justifyContent="space-between" alignItems="center">
            <VStack space={1} flex={1}>
              <HStack space={2} alignItems="center">
                <Text fontWeight="bold" fontSize="md" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.isShared && (
                  <Badge colorScheme="blue" variant="subtle" rounded="md">
                    Partagé
                  </Badge>
                )}
              </HStack>
              
              <HStack space={2} alignItems="center">
                <Text color="gray.500" fontSize="sm">
                  {item.category}
                </Text>
                <Icon 
                  as={MaterialIcons} 
                  name="calendar-today" 
                  size="xs" 
                  color="gray.400" 
                />
                <Text color="gray.500" fontSize="sm">
                  {formatDate(item.dueDate)}
                </Text>
              </HStack>
            </VStack>
            
            <VStack alignItems="flex-end">
              <Text fontWeight="bold" fontSize="lg" color={`${categoryColor}.600`}>
                {formatCurrency(item.amount)}
              </Text>
              <Text fontSize="xs" color="gray.500">
                par mois
              </Text>
            </VStack>
          </HStack>
        </Box>
      </Pressable>
    );
  };
  
  // Rendu du résumé
  const renderSummary = () => {
    if (!summary) return null;
    
    return (
      <Box bg={bgColor} p={4} borderRadius="lg" shadow={1} mb={4}>
        <HStack justifyContent="space-between" alignItems="center" mb={2}>
          <Text fontWeight="bold" fontSize="md">
            Total mensuel
          </Text>
          <Text fontWeight="bold" fontSize="xl" color="primary.600">
            {formatCurrency(summary.totalMonthly)}
          </Text>
        </HStack>
        
        <Divider my={2} />
        
        <HStack justifyContent="space-between">
          <VStack space={0.5} alignItems="center" w="48%">
            <Text color="gray.600" fontSize="sm">
              Abonnements personnels
            </Text>
            <Text fontWeight="medium" fontSize="md">
              {formatCurrency(summary.personalAmount)}
            </Text>
            <Text color="gray.400" fontSize="xs">
              {summary.personalCount} abonnements
            </Text>
          </VStack>
          
          <Divider orientation="vertical" />
          
          <VStack space={0.5} alignItems="center" w="48%">
            <Text color="gray.600" fontSize="sm">
              Abonnements partagés
            </Text>
            <Text fontWeight="medium" fontSize="md">
              {formatCurrency(summary.sharedAmount)}
            </Text>
            <Text color="gray.400" fontSize="xs">
              {summary.sharedCount} abonnements
            </Text>
          </VStack>
        </HStack>
      </Box>
    );
  };
  
  return (
    <Box flex={1} bg="gray.50" safeAreaTop>
      {/* En-tête */}
      <VStack p={4} bg="primary.500">
        <HStack justifyContent="space-between" alignItems="center">
          <Heading color="white" size="md" fontWeight="600">
            Abonnements
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
              onPress={() => navigation.navigate('UpcomingSubscriptions')}
              leftIcon={<Icon as={MaterialIcons} name="event" size="sm" />}
            >
              Prochaines échéances
            </Menu.Item>
            <Menu.Item 
              onPress={() => navigation.navigate('SubscriptionStats')}
              leftIcon={<Icon as={MaterialIcons} name="pie-chart" size="sm" />}
            >
              Statistiques
            </Menu.Item>
          </Menu>
        </HStack>
      </VStack>
      
      {/* Tabs de filtrage */}
      <HStack bg={tabBg} p={1} space={1} justifyContent="center">
        <Button
          size="sm"
          flex={1}
          variant={filter === 'all' ? 'solid' : 'ghost'}
          colorScheme="primary"
          onPress={() => setFilter('all')}
        >
          Tous
        </Button>
        <Button
          size="sm"
          flex={1}
          variant={filter === 'active' ? 'solid' : 'ghost'}
          colorScheme="primary"
          onPress={() => setFilter('active')}
        >
          Actifs
        </Button>
        <Button
          size="sm"
          flex={1}
          variant={filter === 'shared' ? 'solid' : 'ghost'}
          colorScheme="primary"
          onPress={() => setFilter('shared')}
        >
          Partagés
        </Button>
      </HStack>
      
      {isLoading || loadingSummary ? (
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text mt={2} color="gray.500">Chargement des abonnements...</Text>
        </Center>
      ) : (
        <FlatList
          data={filteredSubscriptions}
          renderItem={renderSubscriptionItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 80, // Espace pour le bottom tab
          }}
          ListHeaderComponent={renderSummary}
          ListEmptyComponent={() => (
            <Center p={10}>
              <Icon as={MaterialIcons} name="subscriptions" size="4xl" color="gray.300" />
              <Text mt={4} fontSize="lg" fontWeight="medium" color="gray.500">
                Aucun abonnement {filter !== 'all' ? 'avec ce filtre' : ''}
              </Text>
              <Text textAlign="center" color="gray.400">
                {filter === 'all' 
                  ? "Ajoutez vos premiers abonnements pour suivre vos dépenses récurrentes."
                  : "Modifiez vos filtres ou ajoutez de nouveaux abonnements."}
              </Text>
              <Button
                mt={4}
                colorScheme="primary"
                leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
                onPress={() => navigation.navigate('AddSubscription')}
              >
                Ajouter un abonnement
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
        onPress={() => navigation.navigate('AddSubscription')}
      />
    </Box>
  );
};

export default SubscriptionsScreen;