// src/screens/transactions/TransactionDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Icon,
  Button,
  ScrollView,
  useToast,
  Divider,
  Badge,
  Avatar,
  AlertDialog,
  Spinner,
  Center,
  IconButton,
  Switch,
  Input
} from 'native-base';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import apiClient from '../../api/client';
import { useOffline } from '../../hooks/useOffline';
import syncManager from '../../utils/syncManager';
import CategoryPicker from '../../components/common/CategoryPicker';
import SharingSlider from '../../components/common/SharingSlider';
import { formatCurrency } from '../../utils/formatters';

const TransactionDetailScreen = ({ navigation, route }) => {
  // Récupérer l'ID de la transaction depuis les paramètres
  const { id } = route.params;
  
  // États
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Hooks
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOffline } = useOffline();
  const cancelRef = React.useRef(null);
  
  // Requête pour récupérer les détails de la transaction
  const {
    data: transaction,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(
    ['transaction', id],
    () => apiClient.get(`/transactions/${id}`).then(res => res.data),
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
      onSuccess: (data) => {
        // Initialiser les données du formulaire
        setFormData({
          description: data.description,
          category: data.category,
          isShared: data.isShared,
          sharingRatio: data.sharingRatio || 50,
        });
      },
    }
  );
  
  // Formatage de la date
  const formatDate = (dateString) => {
    return format(parseISO(dateString), 'EEEE d MMMM yyyy', { locale: fr });
  };
  
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
  
  // Déterminer l'icône à afficher
  const getCategoryIcon = (category) => {
    return CATEGORY_ICONS[category] || 'receipt';
  };
  
  // Mise à jour du formulaire
  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Activer le mode édition
  const handleEditMode = () => {
    setIsEditing(true);
  };
  
  // Annuler les modifications
  const handleCancel = () => {
    // Réinitialiser le formulaire
    setFormData({
      description: transaction.description,
      category: transaction.category,
      isShared: transaction.isShared,
      sharingRatio: transaction.sharingRatio || 50,
    });
    
    // Désactiver le mode édition
    setIsEditing(false);
  };
  
  // Sauvegarder les modifications
  const handleSave = async () => {
    try {
      const updatedData = {
        description: formData.description,
        category: formData.category,
        isShared: formData.isShared,
        sharingRatio: formData.isShared ? formData.sharingRatio : null,
      };
      
      if (isOffline) {
        // Mode hors ligne
        await syncManager.updateTransaction(id, updatedData);
        
        toast.show({
          title: 'Modifications enregistrées hors ligne',
          description: 'Elles seront synchronisées dès que vous serez en ligne.',
          status: 'info',
        });
      } else {
        // Mode en ligne
        await apiClient.patch(`/transactions/${id}`, updatedData);
        
        // Invalider les requêtes pour forcer un rafraîchissement
        queryClient.invalidateQueries(['transaction', id]);
        queryClient.invalidateQueries('transactions');
        queryClient.invalidateQueries('latest-transactions');
        queryClient.invalidateQueries('dashboard-summary');
        
        toast.show({
          title: 'Transaction mise à jour',
          description: 'Les modifications ont été enregistrées avec succès.',
          status: 'success',
        });
      }
      
      // Désactiver le mode édition
      setIsEditing(false);
    } catch (error) {
      const errorMessage = 
        error.response?.data?.error || 
        'Une erreur est survenue lors de la mise à jour de la transaction.';
      
      toast.show({
        title: 'Erreur',
        description: errorMessage,
        status: 'error',
      });
    }
  };
  
  // Supprimer la transaction
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      if (isOffline) {
        // Mode hors ligne
        await syncManager.deleteTransaction(id);
        
        toast.show({
          title: 'Transaction supprimée hors ligne',
          description: 'La suppression sera synchronisée dès que vous serez en ligne.',
          status: 'info',
        });
      } else {
        // Mode en ligne
        await apiClient.delete(`/transactions/${id}`);
        
        // Invalider les requêtes pour forcer un rafraîchissement
        queryClient.invalidateQueries('transactions');
        queryClient.invalidateQueries('latest-transactions');
        queryClient.invalidateQueries('dashboard-summary');
        
        toast.show({
          title: 'Transaction supprimée',
          description: 'La transaction a été supprimée avec succès.',
          status: 'success',
        });
      }
      
      // Fermer la boîte de dialogue
      setIsDeleteDialogOpen(false);
      
      // Retourner à l'écran précédent
      navigation.goBack();
    } catch (error) {
      const errorMessage = 
        error.response?.data?.error || 
        'Une erreur est survenue lors de la suppression de la transaction.';
      
      toast.show({
        title: 'Erreur',
        description: errorMessage,
        status: 'error',
      });
      
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Gestion des erreurs
  if (isError) {
    return (
      <Box flex={1} bg="white" safeAreaTop>
        <Box p={4} bg="primary.500">
          <HStack alignItems="center" space={2}>
            <IconButton
              icon={<Icon as={MaterialIcons} name="arrow-back" size="sm" color="white" />}
              variant="unstyled"
              onPress={() => navigation.goBack()}
            />
            <Heading color="white" size="md">
              Détails de la transaction
            </Heading>
          </HStack>
        </Box>
        
        <Center flex={1} p={4}>
          <Icon as={MaterialIcons} name="error" size="4xl" color="red.500" />
          <Text mt={4} fontSize="lg" fontWeight="medium" color="gray.700">
            Erreur lors du chargement
          </Text>
          <Text textAlign="center" color="gray.500" mt={2}>
            {error.message || 'Une erreur est survenue lors du chargement de la transaction.'}
          </Text>
          <Button mt={4} onPress={refetch} leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}>
            Réessayer
          </Button>
        </Center>
      </Box>
    );
  }
  
  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <Box flex={1} bg="white" safeAreaTop>
        <Box p={4} bg="primary.500">
          <HStack alignItems="center" space={2}>
            <IconButton
              icon={<Icon as={MaterialIcons} name="arrow-back" size="sm" color="white" />}
              variant="unstyled"
              onPress={() => navigation.goBack()}
            />
            <Heading color="white" size="md">
              Détails de la transaction
            </Heading>
          </HStack>
        </Box>
        
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text mt={2} color="gray.500">Chargement des détails...</Text>
        </Center>
      </Box>
    );
  }
  
  // Détermine si c'est une dépense ou un revenu
  const isExpense = transaction.amount < 0;
  
  // Détermine la couleur en fonction du type
  const typeColor = isExpense ? "red" : "green";
  
  return (
    <Box flex={1} bg="white" safeAreaTop>
      {/* En-tête */}
      <Box p={4} bg="primary.500">
        <HStack alignItems="center" space={2}>
          <IconButton
            icon={<Icon as={MaterialIcons} name="arrow-back" size="sm" color="white" />}
            variant="unstyled"
            onPress={() => navigation.goBack()}
          />
          <Heading color="white" size="md">
            Détails de la transaction
          </Heading>
        </HStack>
      </Box>
      
      <ScrollView flex={1} px={4} py={4}>
        <VStack space={4}>
          {/* Montant et date */}
          <VStack alignItems="center" space={2} bg={`${typeColor}.50`} p={4} borderRadius="lg">
            <Text fontWeight="medium" color="gray.600" fontSize="sm">
              {formatDate(transaction.date)}
            </Text>
            <Heading size="xl" color={`${typeColor}.600`}>
              {formatCurrency(Math.abs(transaction.amount))}
            </Heading>
            <Badge
              colorScheme={typeColor}
              variant="subtle"
              rounded="full"
              _text={{ fontWeight: "medium" }}
            >
              {isExpense ? "Dépense" : "Revenu"}
            </Badge>
          </VStack>
          
          {/* Description et catégorie */}
          <Box bg="gray.50" p={4} borderRadius="lg">
            <VStack space={4}>
              {/* Description */}
              <VStack space={1}>
                <Text color="gray.500" fontSize="sm">
                  Description
                </Text>
                {isEditing ? (
                  <Input
                    value={formData.description}
                    onChangeText={(value) => updateFormField('description', value)}
                    placeholder="Description de la transaction"
                  />
                ) : (
                  <Text fontWeight="medium" fontSize="md">
                    {transaction.description}
                  </Text>
                )}
              </VStack>
              
              {/* Catégorie */}
              <VStack space={1}>
                <Text color="gray.500" fontSize="sm">
                  Catégorie
                </Text>
                {isEditing ? (
                  <CategoryPicker
                    value={formData.category}
                    onChange={(value) => updateFormField('category', value)}
                    filter={isExpense ? ['expense'] : ['income']}
                  />
                ) : (
                  <HStack space={2} alignItems="center">
                    <Box
                      p={2}
                      bg={`${typeColor}.100`}
                      borderRadius="full"
                    >
                      <Icon
                        as={MaterialIcons}
                        name={getCategoryIcon(transaction.category)}
                        size="md"
                        color={`${typeColor}.500`}
                      />
                    </Box>
                    <Text fontWeight="medium">
                      {transaction.category}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </Box>
          
          {/* Partage */}
          {isExpense && (
            <Box bg="gray.50" p={4} borderRadius="lg">
              <VStack space={3}>
                {isEditing ? (
                  <SharingSlider
                    isShared={formData.isShared}
                    sharingRatio={formData.sharingRatio}
                    onChangeShared={(value) => updateFormField('isShared', value)}
                    onChangeRatio={(value) => updateFormField('sharingRatio', value)}
                  />
                ) : (
                  <>
                    <HStack justifyContent="space-between" alignItems="center">
                      <HStack space={2} alignItems="center">
                        <Icon
                          as={MaterialIcons}
                          name="people"
                          size="sm"
                          color="primary.500"
                        />
                        <Text fontWeight="medium">Dépense partagée</Text>
                      </HStack>
                      <Badge
                        colorScheme={transaction.isShared ? "blue" : "gray"}
                        variant="subtle"
                        rounded="md"
                      >
                        {transaction.isShared ? "Oui" : "Non"}
                      </Badge>
                    </HStack>
                    
                    {transaction.isShared && (
                      <>
                        <Divider />
                        <Text color="gray.500" fontSize="sm">
                          Répartition
                        </Text>
                        <HStack justifyContent="space-between" alignItems="center">
                          <HStack space={2} alignItems="center">
                            <Avatar
                              size="xs"
                              bg="primary.500"
                            >
                              U
                            </Avatar>
                            <VStack>
                              <Text fontSize="xs" color="gray.500">
                                Vous
                              </Text>
                              <Text fontWeight="bold" color="primary.600">
                                {transaction.sharingRatio}%
                              </Text>
                            </VStack>
                          </HStack>
                          
                          <HStack space={2} alignItems="center">
                            <VStack alignItems="flex-end">
                              <Text fontSize="xs" color="gray.500">
                                Partenaire
                              </Text>
                              <Text fontWeight="bold" color="indigo.600">
                                {100 - transaction.sharingRatio}%
                              </Text>
                            </VStack>
                            <Avatar
                              size="xs"
                              bg="indigo.500"
                            >
                              P
                            </Avatar>
                          </HStack>
                        </HStack>
                      </>
                    )}
                  </>
                )}
              </VStack>
            </Box>
          )}
          
          {/* Options */}
          <HStack space={2} mt={2}>
            {isEditing ? (
              <>
                <Button
                  flex={1}
                  variant="outline"
                  colorScheme="gray"
                  onPress={handleCancel}
                >
                  Annuler
                </Button>
                <Button
                  flex={1}
                  colorScheme="primary"
                  onPress={handleSave}
                >
                  Enregistrer
                </Button>
              </>
            ) : (
              <>
                <Button
                  flex={1}
                  variant="outline"
                  colorScheme="primary"
                  onPress={handleEditMode}
                  leftIcon={<Icon as={MaterialIcons} name="edit" size="sm" />}
                >
                  Modifier
                </Button>
                <Button
                  flex={1}
                  variant="outline"
                  colorScheme="danger"
                  onPress={() => setIsDeleteDialogOpen(true)}
                  leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" />}
                >
                  Supprimer
                </Button>
              </>
            )}
          </HStack>
        </VStack>
      </ScrollView>
      
      {/* Boîte de dialogue de confirmation de suppression */}
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Supprimer la transaction</AlertDialog.Header>
          <AlertDialog.Body>
            Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible.
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button
                variant="unstyled"
                colorScheme="coolGray"
                onPress={() => setIsDeleteDialogOpen(false)}
                ref={cancelRef}
              >
                Annuler
              </Button>
              <Button
                colorScheme="danger"
                isLoading={isDeleting}
                onPress={handleDelete}
              >
                Supprimer
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Box>
  );
};

export default TransactionDetailScreen;