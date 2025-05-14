// src/screens/auth/LoginScreen.js
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
  Image,
  useToast,
  Icon,
  Pressable,
  IconButton,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { loginRequest, loginSuccess, loginFailure } from '../../store/authSlice';
import apiClient from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const toast = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      toast.show({
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs.',
        status: 'warning',
      });
      return;
    }

    try {
      dispatch(loginRequest());
      
      // Appel API pour la connexion
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });
      
      const { token, user } = response.data;
      
      // Stocker le token
      await AsyncStorage.setItem('authToken', token);
      
      // Mettre à jour le state Redux
      dispatch(loginSuccess({ token, user }));
      
      toast.show({
        title: 'Connecté',
        description: 'Vous êtes maintenant connecté.',
        status: 'success',
      });
    } catch (error) {
      const errorMessage = 
        error.response?.data?.error || 
        'Impossible de se connecter. Veuillez réessayer.';
      
      dispatch(loginFailure(errorMessage));
      
      toast.show({
        title: 'Erreur de connexion',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  return (
    <Center flex={1} px="4" bg="white">
      <Box safeArea p="2" py="8" w="100%" maxW="320">
        <VStack space={8} alignItems="center">
          {/* Logo de l'app */}
          <Image 
            source={require('../../assets/logo.png')} 
            alt="Twino Logo"
            size="xl"
            fallbackSource={{
              uri: 'https://via.placeholder.com/150?text=Twino'
            }}
          />
          
          <Heading 
            size="xl" 
            fontWeight="semibold" 
            color="primary.500"
            _dark={{ color: "warmGray.50" }}
          >
            Bienvenue
          </Heading>
          <Heading
            mt="-2"
            color="muted.500"
            fontWeight="medium"
            size="xs"
          >
            Connectez-vous pour continuer
          </Heading>

          <VStack space={5} w="100%">
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
            
            <FormControl isRequired>
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
                value={password}
                onChangeText={setPassword}
              />
              <FormControl.HelperText textAlign="right">
                <Link 
                  _text={{
                    fontSize: "xs",
                    fontWeight: "500",
                    color: "primary.500",
                  }} 
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  Mot de passe oublié ?
                </Link>
              </FormControl.HelperText>
            </FormControl>
            
            {error && (
              <Text color="error.500" fontSize="sm">
                {error}
              </Text>
            )}
            
            <Button
              mt="2"
              colorScheme="primary"
              onPress={handleLogin}
              isLoading={isLoading}
              isLoadingText="Connexion..."
            >
              Se connecter
            </Button>
            
            <HStack mt="4" justifyContent="center">
              <Text fontSize="sm" color="muted.500">
                Pas encore de compte ?{" "}
              </Text>
              <Link
                _text={{
                  color: "primary.500",
                  fontWeight: "medium",
                  fontSize: "sm",
                }}
                onPress={() => navigation.navigate('Register')}
              >
                S'inscrire
              </Link>
            </HStack>
          </VStack>
        </VStack>
      </Box>
    </Center>
  );
};

export default LoginScreen;