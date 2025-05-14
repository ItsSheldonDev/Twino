import { extendTheme } from 'native-base';

// Définir vos couleurs personnalisées
const colors = {
  primary: {
    50: '#e6f7ff',
    100: '#b3e0ff',
    200: '#80cbff',
    300: '#4db8ff',
    400: '#1aa3ff',
    500: '#0091ff', // Couleur principale
    600: '#0074cc',
    700: '#005699',
    800: '#003b66',
    900: '#001f33',
  },
  // Ajoutez d'autres couleurs selon votre design
};

// Étendre le thème avec vos personnalisations
export const theme = extendTheme({
  colors,
  fontConfig: {
    Roboto: {
      400: {
        normal: 'Roboto_400Regular',
      },
      500: {
        normal: 'Roboto_500Medium',
      },
      700: {
        normal: 'Roboto_700Bold',
      },
    },
  },
  fonts: {
    heading: 'Roboto',
    body: 'Roboto',
    mono: 'Roboto',
  },
  config: {
    // Support pour le mode sombre
    useSystemColorMode: false,
    initialColorMode: 'light',
  },
});