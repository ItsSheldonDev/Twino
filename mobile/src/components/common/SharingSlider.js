// src/components/common/SharingSlider.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  Slider,
  Switch,
  Avatar,
  Icon,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Composant pour gérer le partage des dépenses ou abonnements
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.isShared - Si l'élément est partagé
 * @param {number} props.sharingRatio - Pourcentage partagé par l'utilisateur (0-100)
 * @param {Function} props.onChangeShared - Fonction appelée lors du changement de statut de partage
 * @param {Function} props.onChangeRatio - Fonction appelée lors du changement de ratio
 * @param {string} props.userName - Nom de l'utilisateur courant
 * @param {string} props.partnerName - Nom du partenaire
 * @param {string} props.userPhoto - URL de la photo de l'utilisateur
 * @param {string} props.partnerPhoto - URL de la photo du partenaire
 */
const SharingSlider = ({
  isShared = false,
  sharingRatio = 50,
  onChangeShared,
  onChangeRatio,
  userName = 'Vous',
  partnerName = 'Partenaire',
  userPhoto,
  partnerPhoto,
}) => {
  // État interne pour le ratio
  const [ratio, setRatio] = useState(sharingRatio);
  
  // Mettre à jour le ratio interne lorsque la prop change
  useEffect(() => {
    setRatio(sharingRatio);
  }, [sharingRatio]);
  
  // Gérer le changement de valeur du slider
  const handleSliderChange = (value) => {
    setRatio(value);
  };
  
  // Appliquer le changement quand on relâche le slider
  const handleSliderComplete = (value) => {
    onChangeRatio(value);
  };
  
  return (
    <Box width="100%">
      {/* Switch pour activer/désactiver le partage */}
      <HStack alignItems="center" justifyContent="space-between" mb={4}>
        <HStack space={2} alignItems="center">
          <Icon
            as={MaterialIcons}
            name="people"
            size="sm"
            color="primary.500"
          />
          <Text fontWeight="medium">Dépense partagée</Text>
        </HStack>
        <Switch
          isChecked={isShared}
          onToggle={() => onChangeShared(!isShared)}
          colorScheme="primary"
        />
      </HStack>
      
      {/* Slider de ratio de partage */}
      {isShared && (
        <VStack space={2} mt={2}>
          <Text color="gray.600" fontSize="sm">
            Répartition
          </Text>
          
          {/* Slider */}
          <Box px={2}>
            <Slider
              value={ratio}
              onChange={handleSliderChange}
              onChangeEnd={handleSliderComplete}
              minValue={0}
              maxValue={100}
              step={5}
              colorScheme="primary"
            >
              <Slider.Track>
                <Slider.FilledTrack />
              </Slider.Track>
              <Slider.Thumb />
            </Slider>
          </Box>
          
          {/* Affichage des ratios */}
          <HStack justifyContent="space-between" mt={2}>
            <HStack space={2} alignItems="center">
              <Avatar
                size="xs"
                source={userPhoto ? { uri: userPhoto } : null}
                bg="primary.500"
              >
                {userName.charAt(0)}
              </Avatar>
              <VStack>
                <Text fontSize="xs" color="gray.500">
                  {userName}
                </Text>
                <Text fontWeight="bold" color="primary.600">
                  {ratio}%
                </Text>
              </VStack>
            </HStack>
            
            <HStack space={2} alignItems="center">
              <VStack alignItems="flex-end">
                <Text fontSize="xs" color="gray.500">
                  {partnerName}
                </Text>
                <Text fontWeight="bold" color="indigo.600">
                  {100 - ratio}%
                </Text>
              </VStack>
              <Avatar
                size="xs"
                source={partnerPhoto ? { uri: partnerPhoto } : null}
                bg="indigo.500"
              >
                {partnerName.charAt(0)}
              </Avatar>
            </HStack>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

export default SharingSlider;