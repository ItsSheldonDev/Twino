// src/screens/auth/RegisterScreen.js
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
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/authSlice';
import apiClient from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const toast = useToast();
  const dispatch = useDispatch();

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Le nom est requis';
    }
    
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit faire au moins 6 caractères';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (validate()) {
      try {
        setIsLoading(true);
        
        const response = await apiClient.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        
        const { token, user } = response.data;
        
        // Stocker le token
        await AsyncStorage.setItem('authToken', token);
        
        // Mettre à jour le state Redux
        dispatch(loginSuccess({ token, user }));
        
        toast.show({
          title: 'Compte créé',
          description: 'Votre compte a été créé avec succès.',
          status: 'success',
        });
      } catch (error) {
        const errorMessage = 
          error.response?.data?.error || 
          'Erreur lors de l\'inscription. Veuillez réessayer.';
        
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
    <Center flex={1} px="3" bg="white">
      <Box safeArea p="2" w="90%" maxW="320">
        <Heading
          size="xl"
          fontWeight="semibold"
          color="primary.500"
          _dark={{ color: "warmGray.50" }}
        >
          Créer un compte
        </Heading>
        <Heading
          mt="1"
          color="muted.500"
          fontWeight="medium"
          size="xs"
        >
          Rejoignez Twino pour gérer vos finances en couple
        </Heading>

        <VStack space={3} mt="5">
          <FormControl isRequired isInvalid={'name' in errors}>
            <FormControl.Label>Nom</FormControl.Label>
            <Input
              placeholder="Votre nom complet"
              InputLeftElement={
                <Icon
                  as={MaterialIcons}
                  name="person"
                  size={5}
                  ml="2"
                  color="muted.400"
                />
              }
              onChangeText={(value) => setFormData({ ...formData, name: value })}
            />
            <FormControl.ErrorMessage>{errors.name}</FormControl.ErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={'email' in errors}>
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
              onChangeText={(value) => setFormData({ ...formData, email: value })}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <FormControl.ErrorMessage>{errors.email}</FormControl.ErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={'password' in errors}>
            <FormControl.Label>Mot de passe</FormControl.Label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Votre mot de passe"
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
              onChangeText={(value) => setFormData({ ...formData, password: value })}
            />
            <FormControl.ErrorMessage>{errors.password}</FormControl.ErrorMessage>
            <FormControl.HelperText>
              Au moins 6 caractères
            </FormControl.HelperText>
          </FormControl>
          
          <FormControl isRequired isInvalid={'confirmPassword' in errors}>
            <FormControl.Label>Confirmer le mot de passe</FormControl.Label>
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmer votre mot de passe"
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
              onChangeText={(value) => setFormData({ ...formData, confirmPassword: value })}
            />
            <FormControl.ErrorMessage>{errors.confirmPassword}</FormControl.ErrorMessage>
          </FormControl>
          
          <Button
            mt="2"
            colorScheme="primary"
            onPress={handleRegister}
            isLoading={isLoading}
            isLoadingText="Inscription en cours..."
          >
            S'inscrire
          </Button>
          
          <HStack mt="4" justifyContent="center">
            <Text fontSize="sm" color="muted.500">
              Déjà inscrit ?{" "}
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

export default RegisterScreen;