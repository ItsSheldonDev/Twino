// src/screens/auth/ResetPasswordScreen.js
import React, { useState } from 'react';
import {
  Box,
  Text,
  Heading,
  VStack,
  FormControl,
  Input,
  Link,
  Button,
  HStack,
  Center,
  useToast,
  Icon,
  Pressable,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { validatePassword, doPasswordsMatch } from '../../utils/validators';

const ResetPasswordScreen = ({ navigation, route }) => {
  // Token reçu en paramètre (via l'URL dans le mail)
  const { token } = route.params || { token: null };

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const toast = useToast();

  // Validation du formulaire
  const validate = () => {
    const newErrors = {};
    
    // Vérification du mot de passe
    const passwordCheck = validatePassword(formData.newPassword);
    if (!passwordCheck.isValid) {
      newErrors.newPassword = passwordCheck.message;
    }
    
    // Vérification de la correspondance des mots de passe
    if (!doPasswordsMatch(formData.newPassword, formData.confirmPassword)) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!token) {
      toast.show({
        title: 'Erreur',
        description: 'Token de réinitialisation invalide ou manquant.',
        status: 'error',
      });
      return;
    }
    
    if (validate()) {
      try {
        setIsLoading(true);
        
        // Appel API pour la réinitialisation du mot de passe
        await apiClient.post('/auth/reset-password', {
          token,
          newPassword: formData.newPassword,
        });
        
        // Indiquer que la réinitialisation est terminée
        setIsComplete(true);
        
        toast.show({
          title: 'Mot de passe réinitialisé',
          description: 'Votre mot de passe a été modifié avec succès.',
          status: 'success',
          duration: 5000,
        });
      } catch (error) {
        const errorMessage = 
          error.response?.data?.error || 
          'Une erreur est survenue. Veuillez réessayer plus tard.';
        
        toast.show({
          title: 'Erreur',
          description: errorMessage,
          status: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Center flex={1} px={4} bg="white">
      <Box safeArea p={2} w="100%" maxW="320">
        <VStack space={4} alignItems="center">
          {/* Icône */}
          <Icon
            as={MaterialIcons}
            name={isComplete ? "check-circle" : "lock-open"}
            size="6xl"
            color={isComplete ? "green.500" : "primary.500"}
          />
          
          <Heading 
            size="xl" 
            fontWeight="semibold" 
            color="primary.500"
          >
            {isComplete ? 'Mot de passe mis à jour' : 'Nouveau mot de passe'}
          </Heading>
          
          {!isComplete ? (
            // Formulaire de réinitialisation
            <VStack space={4} w="100%">
              <Text color="muted.500" textAlign="center" mb={2}>
                Veuillez créer un nouveau mot de passe sécurisé pour votre compte.
              </Text>
              
              <FormControl isRequired isInvalid={'newPassword' in errors}>
                <FormControl.Label>Nouveau mot de passe</FormControl.Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre nouveau mot de passe"
                  InputLeftElement={
                    <Icon
                      as={MaterialIcons}
                      name="lock"
                      size={5}
                      ml="2"
                      color="muted.400"
                    />
                  }
                  InputRightElement={
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                      <Icon
                        as={MaterialIcons}
                        name={showPassword ? "visibility" : "visibility-off"}
                        size={5}
                        mr="2"
                        color="muted.400"
                      />
                    </Pressable>
                  }
                  value={formData.newPassword}
                  onChangeText={(value) => setFormData({ ...formData, newPassword: value })}
                />
                <FormControl.ErrorMessage>{errors.newPassword}</FormControl.ErrorMessage>
                <FormControl.HelperText>
                  Au moins 6 caractères
                </FormControl.HelperText>
              </FormControl>
              
              <FormControl isRequired isInvalid={'confirmPassword' in errors}>
                <FormControl.Label>Confirmer le mot de passe</FormControl.Label>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmez votre mot de passe"
                  InputLeftElement={
                    <Icon
                      as={MaterialIcons}
                      name="lock"
                      size={5}
                      ml="2"
                      color="muted.400"
                    />
                  }
                  InputRightElement={
                    <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Icon
                        as={MaterialIcons}
                        name={showConfirmPassword ? "visibility" : "visibility-off"}
                        size={5}
                        mr="2"
                        color="muted.400"
                      />
                    </Pressable>
                  }
                  value={formData.confirmPassword}
                  onChangeText={(value) => setFormData({ ...formData, confirmPassword: value })}
                />
                <FormControl.ErrorMessage>{errors.confirmPassword}</FormControl.ErrorMessage>
              </FormControl>
              
              <Button
                mt={4}
                colorScheme="primary"
                onPress={handleSubmit}
                isLoading={isLoading}
                isLoadingText="Modification en cours..."
              >
                Réinitialiser le mot de passe
              </Button>
            </VStack>
          ) : (
            // Message de confirmation
            <VStack space={4} w="100%" alignItems="center">
              <Text color="muted.700" textAlign="center">
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </Text>
              
              <Button
                mt={4}
                colorScheme="primary"
                onPress={() => navigation.navigate('Login')}
              >
                Se connecter
              </Button>
            </VStack>
          )}
          
          <HStack mt={4} justifyContent="center">
            <Text fontSize="sm" color="muted.500">
              Besoin d'aide ?{" "}
            </Text>
            <Link
              _text={{
                color: "primary.500",
                fontWeight: "medium",
                fontSize: "sm",
              }}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              Réessayer
            </Link>
          </HStack>
        </VStack>
      </Box>
    </Center>
  );
};

export default ResetPasswordScreen;