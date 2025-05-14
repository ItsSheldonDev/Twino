// src/components/common/CurrencyInput.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Input,
  HStack,
  Text,
  Icon,
  Pressable,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Composant de saisie de montant en devise
 * @param {Object} props - Propriétés du composant
 * @param {number} props.value - Valeur du montant
 * @param {Function} props.onChange - Fonction appelée lors du changement de montant
 * @param {string} props.placeholder - Texte à afficher quand aucun montant n'est saisi
 * @param {boolean} props.isInvalid - Si le champ est invalide
 * @param {string} props.error - Message d'erreur
 * @param {boolean} props.allowNegative - Autoriser les montants négatifs
 * @param {boolean} props.isRevenue - Définir si c'est un revenu (positif) ou une dépense (négatif)
 * @param {string} props.currency - Devise (EUR, USD, etc.)
 */
const CurrencyInput = ({
  value,
  onChange,
  placeholder = "0,00",
  isInvalid = false,
  error = '',
  allowNegative = false,
  isRevenue = false,
  currency = "EUR",
}) => {
  // État interne pour la valeur affichée
  const [displayValue, setDisplayValue] = useState('');
  
  // Mettre à jour la valeur affichée lorsque la valeur change
  useEffect(() => {
    if (value !== undefined && value !== null) {
      // Prendre la valeur absolue car le signe est géré séparément
      const absValue = Math.abs(value);
      
      // Formater la valeur pour l'affichage (remplacer le point par une virgule)
      const formatted = absValue.toString().replace('.', ',');
      
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
  }, [value]);
  
  // Gérer le changement de texte
  const handleChangeText = (text) => {
    // Nettoyer le texte (enlever les espaces, remplacer la virgule par un point)
    let cleanedText = text.replace(/\s/g, '').replace(',', '.');
    
    // Vérifier si le texte est un nombre valide
    if (cleanedText === '' || isNaN(cleanedText)) {
      // Si le texte est vide ou invalide, mettre la valeur à 0 ou null
      onChange(cleanedText === '' ? null : 0);
      setDisplayValue(text);
      return;
    }
    
    // Convertir en nombre
    let numberValue = parseFloat(cleanedText);
    
    // Appliquer le signe en fonction du type de transaction
    if (!allowNegative) {
      numberValue = Math.abs(numberValue);
    }
    
    // Si c'est une dépense, rendre le nombre négatif
    if (!isRevenue && !allowNegative) {
      numberValue = -numberValue;
    }
    
    // Mettre à jour la valeur
    onChange(numberValue);
    
    // Mettre à jour l'affichage (avec virgule)
    setDisplayValue(text);
  };
  
  // Obtenir l'icône et la couleur en fonction du type
  const getIconAndColor = () => {
    if (isRevenue) {
      return {
        icon: 'arrow-downward',
        color: 'green.500',
      };
    } else {
      return {
        icon: 'arrow-upward',
        color: 'red.500',
      };
    }
  };
  
  const { icon, color } = getIconAndColor();
  
  // Symbole de devise selon la monnaie
  const currencySymbol = currency === 'EUR' ? '€' : '$';
  
  return (
    <Box width="100%">
      <HStack 
        borderWidth={1}
        borderColor={isInvalid ? "red.500" : "gray.300"}
        borderRadius="md"
        alignItems="center"
        bg="white"
      >
        {/* Icône du type de transaction */}
        {!allowNegative && (
          <Box pl={3} pr={2}>
            <Icon
              as={MaterialIcons}
              name={icon}
              size="md"
              color={color}
            />
          </Box>
        )}
        
        {/* Champ de saisie */}
        <Input
          flex={1}
          value={displayValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          keyboardType="decimal-pad"
          fontSize="lg"
          fontWeight="medium"
          borderWidth={0}
          textAlign="right"
          px={2}
          py={2}
        />
        
        {/* Symbole de devise */}
        <Box pr={3}>
          <Text fontSize="lg" fontWeight="medium" color="gray.500">
            {currencySymbol}
          </Text>
        </Box>
      </HStack>
      
      {/* Message d'erreur */}
      {isInvalid && error && (
        <Text color="red.500" fontSize="xs" mt={1}>
          {error}
        </Text>
      )}
    </Box>
  );
};

export default CurrencyInput;