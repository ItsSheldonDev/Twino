// src/screens/auth/ForgotPasswordScreen.js
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
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { isValidEmail } from '../../utils/validators';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    // Validation de l'email
    if (!email || !isValidEmail(email)) {
      toast.show({
        title: 'Email invalide',
        description: 'Veuillez entrer une adresse email valide.',
        status: 'warning',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Appel API pour la réinitialisation de mot de passe
      await apiClient.post('/auth/forgot-password', { email });
      
      // Indiquer que l'email a été envoyé
      setIsEmailSent(true);
      
      toast.show({
        title: 'Email envoyé',
        description: 'Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.',
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
  };

  return (
    <Center flex={1} px={4} bg="white">
      <Box safeArea p={2} w="100%" maxW="320">
        <VStack space={4} alignItems="center">
          {/* Logo ou icône */}
          <Icon
            as={MaterialIcons}
            name="lock-reset"
            size="6xl"
            color="primary.500"
          />
          
          <Heading 
            size="xl" 
            fontWeight="semibold" 
            color="primary.500"
          >
            Mot de passe oublié
          </Heading>
          
          {!isEmailSent ? (
            // Formulaire de demande de réinitialisation
            <VStack space={4} w="100%">
              <Text color="muted.500" textAlign="center">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </Text>
              
              <FormControl isRequired>
                <FormControl.Label>Email</FormControl.Label>
                <Input
                  placeholder="exemple@email.com"
                  InputLeftElement={
                    <Icon
                      as={MaterialIcons}
                      name="email"
                      size={5}
                      ml="2"
                      color="muted.400"
                    />
                  }
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </FormControl>
              
              <Button
                mt={2}
                colorScheme="primary"
                onPress={handleSubmit}
                isLoading={isLoading}
                isLoadingText="Envoi en cours..."
              >
                Envoyer le lien
              </Button>
            </VStack>
          ) : (
            // Message de confirmation d'envoi
            <VStack space={4} w="100%" alignItems="center">
              <Icon
                as={MaterialIcons}
                name="check-circle"
                size="4xl"
                color="green.500"
              />
              
              <Text color="muted.700" textAlign="center">
                Un email de réinitialisation a été envoyé à {email}. Veuillez vérifier votre boîte de réception et suivre les instructions.
              </Text>
              
              <Text color="muted.500" textAlign="center" fontSize="sm">
                Si vous ne recevez pas l'email dans les prochaines minutes, vérifiez votre dossier de spam.
              </Text>
              
              <Button
                mt={2}
                variant="outline"
                colorScheme="primary"
                onPress={() => setIsEmailSent(false)}
              >
                Essayer une autre adresse
              </Button>
            </VStack>
          )}
          
          <HStack mt={4} justifyContent="center">
            <Text fontSize="sm" color="muted.500">
              Vous vous souvenez de votre mot de passe ?{" "}
            </Text>
            <Link
              _text={{
                color: "primary.500",
                fontWeight: "medium",
                fontSize: "sm",
              }}
              onPress={() => navigation.navigate('Login')}
            >
              Se connecter
            </Link>
          </HStack>
        </VStack>
      </Box>
    </Center>
  );
};

export default ForgotPasswordScreen;