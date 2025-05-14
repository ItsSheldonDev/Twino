// src/components/common/LoadingScreen.js
import React from 'react';
import { Box, Center, Spinner, Text, VStack, Heading } from 'native-base';

/**
 * Écran de chargement avec Spinner et texte
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre du chargement
 * @param {string} props.message - Message descriptif
 * @param {string} props.size - Taille du spinner ('sm', 'md', 'lg')
 * @param {string} props.color - Couleur du spinner
 */
const LoadingScreen = ({
  title = "Chargement en cours",
  message = "Veuillez patienter pendant le chargement des données...",
  size = "lg",
  color = "primary.500",
}) => {
  return (
    <Center flex={1} bg="white" p={4}>
      <VStack space={4} alignItems="center">
        <Spinner size={size} color={color} />
        {title && (
          <Heading size="md" color="gray.700">
            {title}
          </Heading>
        )}
        {message && (
          <Text textAlign="center" color="gray.500">
            {message}
          </Text>
        )}
      </VStack>
    </Center>
  );
};

export default LoadingScreen;