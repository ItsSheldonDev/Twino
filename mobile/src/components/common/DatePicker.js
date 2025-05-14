// src/components/common/DatePicker.js
import React, { useState } from 'react';
import {
  Box,
  Text,
  HStack,
  Pressable,
  Icon,
  Modal,
  Button,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Platform } from 'react-native';

/**
 * Composant de sélection de date
 * @param {Object} props - Propriétés du composant
 * @param {Date|string} props.value - Date sélectionnée
 * @param {Function} props.onChange - Fonction appelée lors du changement de date
 * @param {string} props.placeholder - Texte à afficher quand aucune date n'est sélectionnée
 * @param {string} props.formatDisplay - Format d'affichage de la date (pour date-fns)
 * @param {boolean} props.isInvalid - Si le champ est invalide
 * @param {string} props.error - Message d'erreur
 * @param {Date} props.minDate - Date minimum sélectionnable
 * @param {Date} props.maxDate - Date maximum sélectionnable
 */
const DatePicker = ({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  formatDisplay = "d MMMM yyyy",
  isInvalid = false,
  error = '',
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(
    value ? (typeof value === 'string' ? new Date(value) : value) : new Date()
  );
  
  // Gérer l'affichage selon la plateforme
  const isIOS = Platform.OS === 'ios';
  
  // Convertir la date pour l'affichage
  const getDisplayDate = () => {
    if (!value) return placeholder;
    
    const dateObj = typeof value === 'string' ? new Date(value) : value;
    
    if (!isValid(dateObj)) return placeholder;
    
    return format(dateObj, formatDisplay, { locale: fr });
  };
  
  // Gérer le changement de date
  const handleDateChange = (event, selectedDate) => {
    if (isIOS) {
      // Sur iOS, on stocke temporairement la date
      setTempDate(selectedDate || tempDate);
    } else {
      // Sur Android, on ferme le picker et on met à jour la date
      setIsOpen(false);
      if (selectedDate) {
        onChange(selectedDate);
      }
    }
  };
  
  // Confirmer la sélection (iOS)
  const handleConfirm = () => {
    onChange(tempDate);
    setIsOpen(false);
  };
  
  // Annuler la sélection (iOS)
  const handleCancel = () => {
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
          <Text color={value ? "gray.800" : "gray.400"}>
            {getDisplayDate()}
          </Text>
          <Icon
            as={MaterialIcons}
            name="calendar-today"
            size="sm"
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
      
      {/* Date Picker */}
      {isOpen && (
        <>
          {isIOS ? (
            // iOS: Utiliser une modal
            <Modal isOpen={isOpen} onClose={handleCancel}>
              <Modal.Content>
                <Modal.Header>Sélectionner une date</Modal.Header>
                <Modal.Body>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    locale="fr-FR"
                    minimumDate={minDate}
                    maximumDate={maxDate}
                  />
                </Modal.Body>
                <Modal.Footer>
                  <Button.Group space={2}>
                    <Button
                      variant="ghost"
                      colorScheme="blueGray"
                      onPress={handleCancel}
                    >
                      Annuler
                    </Button>
                    <Button onPress={handleConfirm}>
                      Confirmer
                    </Button>
                  </Button.Group>
                </Modal.Footer>
              </Modal.Content>
            </Modal>
          ) : (
            // Android: Affichage natif
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={minDate}
              maximumDate={maxDate}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default DatePicker;