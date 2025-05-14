// src/theme/index.js
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
  secondary: {
    50: '#fff8e6',
    100: '#ffebb3',
    200: '#ffde80',
    300: '#ffd24d',
    400: '#ffc61a',
    500: '#ffb700', // Couleur secondaire
    600: '#cc9200',
    700: '#996e00',
    800: '#664900',
    900: '#332500',
  },
  tertiary: {
    50: '#f5e6ff',
    100: '#dcb3ff',
    200: '#c480ff',
    300: '#ab4dff',
    400: '#931aff',
    500: '#8000ff', // Couleur tertiaire
    600: '#6600cc',
    700: '#4d0099',
    800: '#330066',
    900: '#1a0033',
  },
  // Couleurs pour les catégories
  category: {
    food: '#FF6384', // Alimentation
    transport: '#36A2EB', // Transport
    housing: '#FFCE56', // Logement
    leisure: '#9966FF', // Loisirs
    shopping: '#FF9F40', // Shopping
    health: '#4BC0C0', // Santé
    bills: '#FF6384', // Factures
    subscriptions: '#8AC5FF', // Abonnements
    income: '#75DDDD', // Revenus
    savings: '#B576F8', // Épargne
    other: '#D9D9D9', // Autres
  },
};

// Configurer les polices
const fontConfig = {
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
};

const fonts = {
  heading: 'Roboto',
  body: 'Roboto',
  mono: 'Roboto',
};

// Configurer les espacements
const space = {
  px: '1px',
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
};

// Configurer les tailles
const sizes = {
  ...space,
  full: '100%',
  '3xs': 224,
  '2xs': 256,
  'xs': 320,
  'sm': 384,
  'md': 448,
  'lg': 512,
  'xl': 576,
  '2xl': 672,
};

// Configurer les rayons de bordure
const radii = {
  'none': 0,
  'xs': 2,
  'sm': 4,
  'md': 6,
  'lg': 8,
  'xl': 12,
  '2xl': 16,
  '3xl': 24,
  'full': 9999,
};

// Configurer les composants
const components = {
  Button: {
    defaultProps: {
      colorScheme: 'primary',
      size: 'md',
      borderRadius: 'md',
    },
    variants: {
      solid: ({ colorScheme }) => {
        return {
          bg: `${colorScheme}.500`,
          _pressed: {
            bg: `${colorScheme}.600`,
          },
        };
      },
      outline: ({ colorScheme }) => {
        return {
          borderColor: `${colorScheme}.500`,
          _text: {
            color: `${colorScheme}.500`,
          },
          _pressed: {
            bg: `${colorScheme}.50`,
          },
        };
      },
    },
  },
  Input: {
    defaultProps: {
      size: 'md',
      borderRadius: 'md',
      borderWidth: 1,
      borderColor: 'gray.300',
    },
  },
  Heading: {
    baseStyle: {
      fontWeight: 'bold',
    },
  },
  FormControlLabel: {
    baseStyle: {
      _text: {
        fontSize: 'sm',
        fontWeight: 'medium',
      },
    },
  },
};

// Étendre le thème avec les personnalisations
export const theme = extendTheme({
  colors,
  fontConfig,
  fonts,
  space,
  sizes,
  radii,
  components,
  config: {
    // Support pour le mode sombre
    useSystemColorMode: false,
    initialColorMode: 'light',
  },
});