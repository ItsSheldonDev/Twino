// src/components/common/EmptyState.js
import React from 'react';
import { Box, Center, Icon, Text, Button, VStack } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Composant pour afficher un état vide (aucune donnée)
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre principal
 * @param {string} props.message - Message descriptif
 * @param {string} props.icon - Nom de l'icône (MaterialIcons)
 * @param {string} props.buttonText - Texte du bouton d'action
 * @param {Function} props.onPress - Fonction appelée au clic sur le bouton
 * @param {string} props.iconColor - Couleur de l'icône
 */
const EmptyState = ({
  title = "Aucune donnée",
  message = "Aucun élément à afficher pour le moment.",
  icon = "inbox",
  buttonText,
  onPress,
  iconColor = "gray.300",
}) => {
  return (
    <Center p={10} flex={1}>
      <VStack space={4} alignItems="center">
        <Icon 
          as={MaterialIcons} 
          name={icon} 
          size="6xl" 
          color={iconColor} 
        />
        
        <VStack space={1} alignItems="center">
          <Text fontSize="lg" fontWeight="medium" color="gray.600">
            {title}
          </Text>
          <Text textAlign="center" color="gray.500">
            {message}
          </Text>
        </VStack>
        
        {buttonText && onPress && (
          <Button 
            mt={2}
            colorScheme="primary"
            leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
            onPress={onPress}
          >
            {buttonText}
          </Button>
        )}
      </VStack>
    </Center>
  );
};

export default EmptyState;