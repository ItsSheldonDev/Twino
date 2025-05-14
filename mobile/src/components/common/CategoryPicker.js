// src/components/common/CategoryPicker.js
import React, { useState } from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  Pressable,
  Button,
  Icon,
  ScrollView,
  Modal,
  FlatList,
  Input,
  IconButton,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Liste des catégories avec leurs icônes et couleurs
 */
const CATEGORIES = {
  // Dépenses
  'Alimentation': { 
    icon: 'restaurant', 
    color: 'red.500', 
    type: 'expense'
  },
  'Transport': { 
    icon: 'directions-car', 
    color: 'blue.500', 
    type: 'expense'
  },
  'Logement': { 
    icon: 'home', 
    color: 'orange.500', 
    type: 'expense'
  },
  'Loisirs': { 
    icon: 'sports-esports', 
    color: 'purple.500', 
    type: 'expense'
  },
  'Shopping': { 
    icon: 'shopping-bag', 
    color: 'pink.500', 
    type: 'expense'
  },
  'Santé': { 
    icon: 'medical-services', 
    color: 'green.500', 
    type: 'expense'
  },
  'Factures': { 
    icon: 'receipt', 
    color: 'amber.500', 
    type: 'expense'
  },
  'Abonnements': { 
    icon: 'subscriptions', 
    color: 'indigo.500', 
    type: 'expense'
  },
  
  // Revenus
  'Salaire': { 
    icon: 'account-balance-wallet', 
    color: 'green.500', 
    type: 'income'
  },
  'Freelance': { 
    icon: 'work', 
    color: 'cyan.500', 
    type: 'income'
  },
  'Cadeaux': { 
    icon: 'card-giftcard', 
    color: 'pink.500', 
    type: 'income'
  },
  'Remboursements': { 
    icon: 'undo', 
    color: 'blue.500', 
    type: 'income'
  },
  
  // Épargne
  'Épargne': { 
    icon: 'savings', 
    color: 'teal.500', 
    type: 'savings'
  },
  
  // Divers
  'Autres': { 
    icon: 'more-horiz', 
    color: 'gray.500', 
    type: 'expense'
  }
};

/**
 * Composant pour sélectionner une catégorie avec une modal
 * @param {Object} props - Propriétés du composant
 * @param {string} props.value - Catégorie sélectionnée
 * @param {Function} props.onChange - Fonction appelée lors du changement de catégorie
 * @param {string} props.placeholder - Texte à afficher quand aucune catégorie n'est sélectionnée
 * @param {Array<string>} props.filter - Types de catégories à afficher ('expense', 'income', 'savings')
 * @param {boolean} props.isInvalid - Si le champ est invalide
 * @param {string} props.error - Message d'erreur
 */
const CategoryPicker = ({
  value,
  onChange,
  placeholder = "Sélectionner une catégorie",
  filter = ['expense', 'income', 'savings'],
  isInvalid = false,
  error = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Filtrer les catégories selon les types et la recherche
  const filteredCategories = Object.entries(CATEGORIES)
    .filter(([name, data]) => filter.includes(data.type))
    .filter(([name]) => 
      name.toLowerCase().includes(search.toLowerCase())
    );
  
  // Récupérer les données de la catégorie sélectionnée
  const selectedCategory = value ? CATEGORIES[value] : null;
  
  // Fermer la modal et mettre à jour la valeur
  const handleSelect = (category) => {
    onChange(category);
    setIsOpen(false);
  };
  
  return (
    <Box width="100%">
      {/* Bouton de sélection */}
      <Pressable
        onPress={() => setIsOpen(true)}
        borderWidth={1}
        borderColor={isInvalid ? "red.500" : "gray.300"}
        borderRadius="md"
        p={2}
        bg="white"
      >
        <HStack alignItems="center" justifyContent="space-between">
          {selectedCategory ? (
            <HStack alignItems="center" space={2}>
              <Box
                p={1.5}
                bg={selectedCategory.color + "20"}
                borderRadius="full"
              >
                <Icon
                  as={MaterialIcons}
                  name={selectedCategory.icon}
                  size="md"
                  color={selectedCategory.color}
                />
              </Box>
              <Text>{value}</Text>
            </HStack>
          ) : (
            <Text color="gray.400">{placeholder}</Text>
          )}
          <Icon
            as={MaterialIcons}
            name="arrow-drop-down"
            size="md"
            color="gray.400"
          />
        </HStack>
      </Pressable>
      
      {/* Message d'erreur */}
      {isInvalid && error && (
        <Text color="red.500" fontSize="xs" mt={1}>
          {error}
        </Text>
      )}
      
      {/* Modal de sélection */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="full">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Sélectionner une catégorie</Modal.Header>
          <Modal.Body p={2}>
            {/* Barre de recherche */}
            <Input
              placeholder="Rechercher une catégorie"
              value={search}
              onChangeText={setSearch}
              mb={4}
              size="md"
              InputLeftElement={
                <Icon
                  as={MaterialIcons}
                  name="search"
                  size={5}
                  ml={2}
                  color="gray.400"
                />
              }
              InputRightElement={
                search ? (
                  <IconButton
                    icon={<Icon as={MaterialIcons} name="close" size="xs" />}
                    onPress={() => setSearch('')}
                    colorScheme="light"
                    variant="ghost"
                    mr={1}
                  />
                ) : null
              }
            />
            
            {/* Liste des catégories */}
            <FlatList
              data={filteredCategories}
              keyExtractor={([name]) => name}
              renderItem={({ item: [name, data] }) => (
                <Pressable
                  onPress={() => handleSelect(name)}
                  py={2}
                  px={4}
                  borderRadius="md"
                  bg={value === name ? data.color + "20" : "transparent"}
                  _pressed={{ bg: data.color + "30" }}
                >
                  <HStack alignItems="center" space={3}>
                    <Box
                      p={1.5}
                      bg={data.color + "20"}
                      borderRadius="full"
                    >
                      <Icon
                        as={MaterialIcons}
                        name={data.icon}
                        size="md"
                        color={data.color}
                      />
                    </Box>
                    <Text
                      fontWeight={value === name ? "bold" : "normal"}
                    >
                      {name}
                    </Text>
                    {value === name && (
                      <Icon
                        as={MaterialIcons}
                        name="check"
                        size="sm"
                        color={data.color}
                        ml="auto"
                      />
                    )}
                  </HStack>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <Box h={1} bg="gray.100" my={1} />}
            />
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

export default CategoryPicker;