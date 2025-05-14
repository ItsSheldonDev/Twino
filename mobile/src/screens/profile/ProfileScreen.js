// src/screens/profile/ProfileScreen.js
import React, { useState } from 'react';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Icon,
  Avatar,
  IconButton,
  Divider,
  useColorModeValue,
  useToast,
  Center,
  Button,
  ScrollView,
  Pressable,
  Switch,
  AlertDialog,
} from 'native-base';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import apiClient from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const ProfileScreen = ({ navigation }) => {
  // État local pour la confirmation de déconnexion
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  
  // Hooks
  const dispatch = useDispatch();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Références pour AlertDialog
  const cancelRef = React.useRef(null);
  
  // Récupération de l'utilisateur depuis Redux
  const user = useSelector((state) => state.auth.user);
  
  // Récupération du profil utilisateur
  const { data: profile, isLoading } = useQuery(
    ['profile'],
    () => apiClient.get('/profile').then(res => res.data),
    {
      staleTime: 1000 * 60 * 15, // 15 minutes
    }
  );
  
  // Récupération des paramètres de notifications
  const { data: notificationSettings } = useQuery(
    ['notification-settings'],
    () => apiClient.get('/notifications/settings').then(res => res.data),
    {
      staleTime: 1000 * 60 * 30, // 30 minutes
      onSuccess: (data) => {
        setIsNotificationsEnabled(data.enabled);
      }
    }
  );
  
  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      // Suppression du token
      await AsyncStorage.removeItem('authToken');
      
      // Nettoyage du cache de requêtes
      queryClient.clear();
      
      // Dispatch de l'action de déconnexion
      dispatch(logout());
      
      toast.show({
        title: 'Déconnecté',
        description: 'Vous avez été déconnecté avec succès.',
        status: 'success',
      });
    } catch (error) {
      toast.show({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la déconnexion.',
        status: 'error',
      });
    }
  };
  
  // Gestion du dark mode
  const toggleDarkMode = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    // Ici, vous pourriez sauvegarder la préférence dans AsyncStorage
    try {
      await AsyncStorage.setItem('darkMode', JSON.stringify(newValue));
      toast.show({
        title: newValue ? 'Mode sombre activé' : 'Mode clair activé',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du mode:', error);
    }
  };
  
  // Gestion des notifications
  const toggleNotifications = async () => {
    const newValue = !isNotificationsEnabled;
    setIsNotificationsEnabled(newValue);
    
    try {
      // Mise à jour dans l'API
      await apiClient.patch('/notifications/settings', {
        enabled: newValue,
      });
      
      // Invalidation du cache pour réactualiser
      queryClient.invalidateQueries(['notification-settings']);
      
      toast.show({
        title: newValue ? 'Notifications activées' : 'Notifications désactivées',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      // Rétablir l'état précédent en cas d'erreur
      setIsNotificationsEnabled(!newValue);
      
      toast.show({
        title: 'Erreur',
        description: 'Impossible de modifier les paramètres de notification.',
        status: 'error',
      });
    }
  };
  
  // Styles
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Initiales pour l'avatar (si pas de photo)
  const getInitials = () => {
    if (!user || !user.name) return '?';
    return user.name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };
  
  return (
    <Box flex={1} bg="gray.50" safeAreaTop>
      {/* En-tête */}
      <Box p={4} bg="primary.500">
        <Heading color="white" size="md" fontWeight="600">
          Profil
        </Heading>
      </Box>
      
      <ScrollView>
        {/* Informations du profil */}
        <Box bg={bgColor} shadow={1} mt={4} mx={4} borderRadius="lg">
          <VStack p={4} space={4} alignItems="center">
            <Avatar 
              size="2xl"
              source={
                user?.photoUrl 
                  ? { uri: user.photoUrl }
                  : null
              }
              bg="primary.500"
            >
              {getInitials()}
              <Avatar.Badge bg="green.500" />
            </Avatar>
            
            <VStack alignItems="center">
              <Heading size="md">{user?.name || 'Utilisateur'}</Heading>
              <Text color="gray.500">{user?.email || 'email@exemple.com'}</Text>
            </VStack>
            
            <Button 
              leftIcon={<Icon as={MaterialIcons} name="edit" size="sm" />}
              onPress={() => navigation.navigate('EditProfile')}
              variant="outline"
              colorScheme="primary"
            >
              Modifier le profil
            </Button>
          </VStack>
        </Box>
        
        {/* Paramètres du compte */}
        <Box bg={bgColor} shadow={1} mt={4} mx={4} borderRadius="lg">
          <VStack space={0} divider={<Divider bg={borderColor} />}>
            <Heading p={4} size="sm">
              Paramètres du compte
            </Heading>
            
            <Pressable 
              onPress={() => navigation.navigate('ChangePassword')}
              p={4}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space={3} alignItems="center">
                  <Icon as={MaterialIcons} name="lock" size="sm" color="gray.500" />
                  <Text>Changer le mot de passe</Text>
                </HStack>
                <Icon as={MaterialIcons} name="chevron-right" size="sm" color="gray.400" />
              </HStack>
            </Pressable>
            
            <Pressable 
              onPress={() => navigation.navigate('ChangeEmail')}
              p={4}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space={3} alignItems="center">
                  <Icon as={MaterialIcons} name="email" size="sm" color="gray.500" />
                  <Text>Changer l'email</Text>
                </HStack>
                <Icon as={MaterialIcons} name="chevron-right" size="sm" color="gray.400" />
              </HStack>
            </Pressable>
            
            <Pressable 
              onPress={() => navigation.navigate('BankConnections')}
              p={4}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space={3} alignItems="center">
                  <Icon as={MaterialIcons} name="account-balance" size="sm" color="gray.500" />
                  <Text>Connexions bancaires</Text>
                </HStack>
                <Icon as={MaterialIcons} name="chevron-right" size="sm" color="gray.400" />
              </HStack>
            </Pressable>
          </VStack>
        </Box>
        
        {/* Paramètres de l'application */}
        <Box bg={bgColor} shadow={1} mt={4} mx={4} borderRadius="lg">
          <VStack space={0} divider={<Divider bg={borderColor} />}>
            <Heading p={4} size="sm">
              Paramètres de l'application
            </Heading>
            
            <HStack p={4} justifyContent="space-between" alignItems="center">
              <HStack space={3} alignItems="center">
                <Icon as={MaterialIcons} name="notifications" size="sm" color="gray.500" />
                <Text>Notifications</Text>
              </HStack>
              <Switch 
                isChecked={isNotificationsEnabled} 
                onToggle={toggleNotifications} 
                colorScheme="primary"
              />
            </HStack>
            
            <HStack p={4} justifyContent="space-between" alignItems="center">
              <HStack space={3} alignItems="center">
                <Icon as={MaterialIcons} name="nightlight-round" size="sm" color="gray.500" />
                <Text>Mode sombre</Text>
              </HStack>
              <Switch 
                isChecked={isDarkMode} 
                onToggle={toggleDarkMode} 
                colorScheme="primary"
              />
            </HStack>
            
            <Pressable 
              onPress={() => navigation.navigate('NotificationSettings')}
              p={4}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space={3} alignItems="center">
                  <Icon as={MaterialIcons} name="settings" size="sm" color="gray.500" />
                  <Text>Paramètres de notification</Text>
                </HStack>
                <Icon as={MaterialIcons} name="chevron-right" size="sm" color="gray.400" />
              </HStack>
            </Pressable>
          </VStack>
        </Box>
        
        {/* Support et informations */}
        <Box bg={bgColor} shadow={1} mt={4} mx={4} borderRadius="lg">
          <VStack space={0} divider={<Divider bg={borderColor} />}>
            <Heading p={4} size="sm">
              Support et informations
            </Heading>
            
            <Pressable 
              onPress={() => navigation.navigate('HelpCenter')}
              p={4}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space={3} alignItems="center">
                  <Icon as={MaterialIcons} name="help" size="sm" color="gray.500" />
                  <Text>Centre d'aide</Text>
                </HStack>
                <Icon as={MaterialIcons} name="chevron-right" size="sm" color="gray.400" />
              </HStack>
            </Pressable>
            
            <Pressable 
              onPress={() => navigation.navigate('PrivacyPolicy')}
              p={4}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space={3} alignItems="center">
                  <Icon as={MaterialIcons} name="privacy-tip" size="sm" color="gray.500" />
                  <Text>Politique de confidentialité</Text>
                </HStack>
                <Icon as={MaterialIcons} name="chevron-right" size="sm" color="gray.400" />
              </HStack>
            </Pressable>
            
            <Pressable 
              onPress={() => navigation.navigate('TermsOfService')}
              p={4}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space={3} alignItems="center">
                  <Icon as={MaterialIcons} name="description" size="sm" color="gray.500" />
                  <Text>Conditions d'utilisation</Text>
                </HStack>
                <Icon as={MaterialIcons} name="chevron-right" size="sm" color="gray.400" />
              </HStack>
            </Pressable>
            
            <Pressable 
              onPress={() => navigation.navigate('About')}
              p={4}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space={3} alignItems="center">
                  <Icon as={MaterialIcons} name="info" size="sm" color="gray.500" />
                  <Text>À propos de Twino</Text>
                </HStack>
                <Icon as={MaterialIcons} name="chevron-right" size="sm" color="gray.400" />
              </HStack>
            </Pressable>
          </VStack>
        </Box>
        
        {/* Bouton de déconnexion */}
        <Button 
          colorScheme="danger" 
          variant="outline"
          mx={4} 
          my={6}
          leftIcon={<Icon as={MaterialIcons} name="logout" size="sm" />}
          onPress={() => setIsLogoutAlertOpen(true)}
        >
          Se déconnecter
        </Button>
      </ScrollView>
      
      {/* Dialogue de confirmation de déconnexion */}
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={isLogoutAlertOpen}
        onClose={() => setIsLogoutAlertOpen(false)}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Se déconnecter</AlertDialog.Header>
          <AlertDialog.Body>
            Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre compte.
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button
                variant="unstyled"
                colorScheme="coolGray"
                onPress={() => setIsLogoutAlertOpen(false)}
                ref={cancelRef}
              >
                Annuler
              </Button>
              <Button
                colorScheme="danger"
                onPress={() => {
                  setIsLogoutAlertOpen(false);
                  handleLogout();
                }}
              >
                Se déconnecter
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Box>
  );
};

export default ProfileScreen;