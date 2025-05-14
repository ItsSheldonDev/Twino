// src/screens/subscriptions/AddSubscriptionScreen.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  FormControl,
  Input,
  Button,
  ScrollView,
  Icon,
  useToast,
  Divider,
  IconButton,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { format, addMonths, parseISO } from 'date-fns';

import apiClient from '../../api/client';
import syncManager from '../../utils/syncManager';
import { useOffline } from '../../hooks/useOffline';
import { validateForm } from '../../utils/validators';

import CategoryPicker from '../../components/common/CategoryPicker';
import DatePicker from '../../components/common/DatePicker';
import CurrencyInput from '../../components/common/CurrencyInput';
import SharingSlider from '../../components/common/SharingSlider';

const AddSubscriptionScreen = ({ navigation }) => {
  // États pour le formulaire
  const [formData, setFormData] = useState({
    name: '',
    amount: null,
    category: 'Abonnements',
    dueDate: new Date(), // Date du prochain paiement
    isShared: false,
    sharingRatio: 50,
    description: '',
    renewalPeriod: 'monthly', // 'monthly', 'quarterly', 'annual'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hooks
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOffline } = useOffline();
  
  // Règles de validation du formulaire
  const validationRules = {
    name: [
      { type: 'required', message: 'Le nom est requis' },
      { type: 'maxLength', value: 100, message: 'Maximum 100 caractères' }
    ],
    amount: [
      { type: 'required', message: 'Le montant est requis' },
      { 
        type: 'custom', 
        validate: (value) => value !== 0, 
        message: 'Le montant ne peut pas être zéro' 
      }
    ],
    category: [
      { type: 'required', message: 'La catégorie est requise' }
    ],
    dueDate: [
      { type: 'required', message: 'La date est requise' },
      { type: 'date', message: 'Date invalide' }
    ]
  };
  
  // Mise à jour du formulaire
  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // Fonction pour calculer la prochaine date de renouvellement
  const getNextDueDate = (current, period) => {
    switch (period) {
      case 'monthly':
        return addMonths(current, 1);
      case 'quarterly':
        return addMonths(current, 3);
      case 'annual':
        return addMonths(current, 12);
      default:
        return addMonths(current, 1);
    }
  };
  
  // Soumission du formulaire
  const handleSubmit = async () => {
    // Valider le formulaire
    const formErrors = validateForm(formData, validationRules);
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      
      toast.show({
        title: 'Erreur de validation',
        description: 'Veuillez corriger les erreurs du formulaire.',
        status: 'warning',
      });
      
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Préparer les données à envoyer
      const subscriptionData = {
        name: formData.name,
        amount: Math.abs(formData.amount), // Les abonnements sont toujours des dépenses
        category: formData.category,
        dueDate: format(formData.dueDate, 'yyyy-MM-dd'),
        isShared: formData.isShared,
        sharingRatio: formData.isShared ? formData.sharingRatio : null,
        description: formData.description,
        renewalPeriod: formData.renewalPeriod,
      };
      
      if (isOffline) {
        // Mode hors ligne : stocker dans la file d'attente
        await syncManager.addSubscription(subscriptionData);
        
        toast.show({
          title: 'Abonnement enregistré hors ligne',
          description: 'Il sera synchronisé dès que vous serez en ligne.',
          status: 'info',
        });
      } else {
        // Mode en ligne : envoyer directement
        await apiClient.post('/subscriptions', subscriptionData);
        
        // Invalider les requêtes pour forcer un rafraîchissement
        queryClient.invalidateQueries('subscriptions');
        queryClient.invalidateQueries('subscriptions-summary');
        queryClient.invalidateQueries('dashboard-summary');
        
        toast.show({
          title: 'Abonnement ajouté',
          description: 'L\'abonnement a été enregistré avec succès.',
          status: 'success',
        });
      }
      
      // Retourner à l'écran précédent
      navigation.goBack();
    } catch (error) {
      const errorMessage = 
        error.response?.data?.error || 
        'Une erreur est survenue lors de l\'ajout de l\'abonnement.';
      
      toast.show({
        title: 'Erreur',
        description: errorMessage,
        status: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
            Ajouter un abonnement
          </Heading>
        </HStack>
      </Box>
      
      <ScrollView px={4} py={4}>
        <VStack space={4}>
          {/* Nom */}
          <FormControl isRequired isInvalid={'name' in errors}>
            <FormControl.Label>Nom de l'abonnement</FormControl.Label>
            <Input
              placeholder="Ex: Netflix, Spotify, etc."
              value={formData.name}
              onChangeText={(value) => updateFormField('name', value)}
              InputLeftElement={
                <Icon
                  as={MaterialIcons}
                  name="subscriptions"
                  size={5}
                  ml="2"
                  color="muted.400"
                />
              }
            />
            <FormControl.ErrorMessage>{errors.name}</FormControl.ErrorMessage>
          </FormControl>
          
          {/* Montant */}
          <FormControl isRequired isInvalid={'amount' in errors}>
            <FormControl.Label>Montant</FormControl.Label>
            <CurrencyInput
              value={formData.amount}
              onChange={(value) => updateFormField('amount', value)}
              isRevenue={false} // Les abonnements sont toujours des dépenses
              isInvalid={'amount' in errors}
              error={errors.amount}
            />
          </FormControl>
          
          {/* Catégorie */}
          <FormControl isRequired isInvalid={'category' in errors}>
            <FormControl.Label>Catégorie</FormControl.Label>
            <CategoryPicker
              value={formData.category}
              onChange={(value) => updateFormField('category', value)}
              filter={['expense']}
              isInvalid={'category' in errors}
              error={errors.category}
            />
          </FormControl>
          
          {/* Période de renouvellement */}
          <FormControl>
            <FormControl.Label>Période de renouvellement</FormControl.Label>
            <HStack space={2}>
              <Button
                flex={1}
                variant={formData.renewalPeriod === 'monthly' ? 'solid' : 'outline'}
                colorScheme="primary"
                onPress={() => updateFormField('renewalPeriod', 'monthly')}
              >
                Mensuel
              </Button>
              <Button
                flex={1}
                variant={formData.renewalPeriod === 'quarterly' ? 'solid' : 'outline'}
                colorScheme="primary"
                onPress={() => updateFormField('renewalPeriod', 'quarterly')}
              >
                Trimestriel
              </Button>
              <Button
                flex={1}
                variant={formData.renewalPeriod === 'annual' ? 'solid' : 'outline'}
                colorScheme="primary"
                onPress={() => updateFormField('renewalPeriod', 'annual')}
              >
                Annuel
              </Button>
            </HStack>
          </FormControl>
          
          {/* Date de paiement */}
          <FormControl isRequired isInvalid={'dueDate' in errors}>
            <FormControl.Label>Prochaine date de paiement</FormControl.Label>
            <DatePicker
              value={formData.dueDate}
              onChange={(value) => updateFormField('dueDate', value)}
              isInvalid={'dueDate' in errors}
              error={errors.dueDate}
            />
          </FormControl>
          
          {/* Description */}
          <FormControl>
            <FormControl.Label>Description (optionnel)</FormControl.Label>
            <Input
              placeholder="Notes supplémentaires..."
              value={formData.description}
              onChangeText={(value) => updateFormField('description', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              InputLeftElement={
                <Icon
                  as={MaterialIcons}
                  name="description"
                  size={5}
                  ml="2"
                  color="muted.400"
                />
              }
            />
          </FormControl>
          
          <Divider my={2} />
          
          {/* Partage */}
          <SharingSlider
            isShared={formData.isShared}
            sharingRatio={formData.sharingRatio}
            onChangeShared={(value) => updateFormField('isShared', value)}
            onChangeRatio={(value) => updateFormField('sharingRatio', value)}
          />
          
          {/* Bouton d'envoi */}
          <Button
            mt={4}
            colorScheme="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isLoadingText="Enregistrement..."
          >
            Ajouter l'abonnement
          </Button>
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default AddSubscriptionScreen;