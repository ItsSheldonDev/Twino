// src/screens/transactions/AddTransactionScreen.js
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
  Radio,
  Divider,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import apiClient from '../../api/client';
import syncManager from '../../utils/syncManager';
import { useOffline } from '../../hooks/useOffline';
import { validateForm } from '../../utils/validators';

import CategoryPicker from '../../components/common/CategoryPicker';
import DatePicker from '../../components/common/DatePicker';
import CurrencyInput from '../../components/common/CurrencyInput';
import SharingSlider from '../../components/common/SharingSlider';

const AddTransactionScreen = ({ navigation }) => {
  // États pour le formulaire
  const [formData, setFormData] = useState({
    description: '',
    amount: null,
    category: '',
    date: new Date(),
    isShared: false,
    sharingRatio: 50,
    type: 'expense', // 'expense' ou 'income'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hooks
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOffline } = useOffline();
  
  // Règles de validation du formulaire
  const validationRules = {
    description: [
      { type: 'required', message: 'La description est requise' },
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
    date: [
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
      const transactionData = {
        description: formData.description,
        amount: formData.type === 'expense' ? -Math.abs(formData.amount) : Math.abs(formData.amount),
        category: formData.category,
        date: format(formData.date, 'yyyy-MM-dd'),
        isShared: formData.isShared,
        sharingRatio: formData.isShared ? formData.sharingRatio : null,
      };
      
      if (isOffline) {
        // Mode hors ligne : stocker dans la file d'attente
        await syncManager.addTransaction(transactionData);
        
        toast.show({
          title: 'Transaction enregistrée hors ligne',
          description: 'Elle sera synchronisée dès que vous serez en ligne.',
          status: 'info',
        });
      } else {
        // Mode en ligne : envoyer directement
        await apiClient.post('/transactions', transactionData);
        
        // Invalider les requêtes pour forcer un rafraîchissement
        queryClient.invalidateQueries('transactions');
        queryClient.invalidateQueries('latest-transactions');
        queryClient.invalidateQueries('dashboard-summary');
        
        toast.show({
          title: 'Transaction ajoutée',
          description: 'La transaction a été enregistrée avec succès.',
          status: 'success',
        });
      }
      
      // Retourner à l'écran précédent
      navigation.goBack();
    } catch (error) {
      const errorMessage = 
        error.response?.data?.error || 
        'Une erreur est survenue lors de l\'ajout de la transaction.';
      
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
          <Button
            variant="unstyled"
            onPress={() => navigation.goBack()}
            p={0}
            _text={{ color: 'white' }}
            leftIcon={<Icon as={MaterialIcons} name="arrow-back" size="sm" color="white" />}
          />
          <Heading color="white" size="md">
            Ajouter une transaction
          </Heading>
        </HStack>
      </Box>
      
      <ScrollView px={4} py={4}>
        <VStack space={4}>
          {/* Type de transaction */}
          <FormControl>
            <FormControl.Label>Type de transaction</FormControl.Label>
            <Radio.Group
              name="transactionType"
              value={formData.type}
              onChange={(value) => updateFormField('type', value)}
            >
              <HStack space={6}>
                <Radio value="expense" colorScheme="red">
                  Dépense
                </Radio>
                <Radio value="income" colorScheme="green">
                  Revenu
                </Radio>
              </HStack>
            </Radio.Group>
          </FormControl>
          
          {/* Montant */}
          <FormControl isRequired isInvalid={'amount' in errors}>
            <FormControl.Label>Montant</FormControl.Label>
            <CurrencyInput
              value={formData.amount}
              onChange={(value) => updateFormField('amount', value)}
              isRevenue={formData.type === 'income'}
              isInvalid={'amount' in errors}
              error={errors.amount}
            />
          </FormControl>
          
          {/* Description */}
          <FormControl isRequired isInvalid={'description' in errors}>
            <FormControl.Label>Description</FormControl.Label>
            <Input
              placeholder="Ex: Courses au supermarché"
              value={formData.description}
              onChangeText={(value) => updateFormField('description', value)}
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
            <FormControl.ErrorMessage>{errors.description}</FormControl.ErrorMessage>
          </FormControl>
          
          {/* Catégorie */}
          <FormControl isRequired isInvalid={'category' in errors}>
            <FormControl.Label>Catégorie</FormControl.Label>
            <CategoryPicker
              value={formData.category}
              onChange={(value) => updateFormField('category', value)}
              filter={formData.type === 'income' ? ['income'] : ['expense']}
              isInvalid={'category' in errors}
              error={errors.category}
            />
          </FormControl>
          
          {/* Date */}
          <FormControl isRequired isInvalid={'date' in errors}>
            <FormControl.Label>Date</FormControl.Label>
            <DatePicker
              value={formData.date}
              onChange={(value) => updateFormField('date', value)}
              isInvalid={'date' in errors}
              error={errors.date}
            />
          </FormControl>
          
          <Divider my={2} />
          
          {/* Partage */}
          {formData.type === 'expense' && (
            <SharingSlider
              isShared={formData.isShared}
              sharingRatio={formData.sharingRatio}
              onChangeShared={(value) => updateFormField('isShared', value)}
              onChangeRatio={(value) => updateFormField('sharingRatio', value)}
            />
          )}
          
          {/* Bouton d'envoi */}
          <Button
            mt={4}
            colorScheme="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isLoadingText="Enregistrement..."
          >
            Ajouter la transaction
          </Button>
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default AddTransactionScreen;