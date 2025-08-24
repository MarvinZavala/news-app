# News App

Aplicación móvil de noticias desarrollada con React Native y Expo.

## Tecnologías utilizadas

- React Native
- Expo SDK 53
- TypeScript
- React Navigation
- AsyncStorage

## Estructura del proyecto

```
src/
  ├── assets/           # Imágenes, íconos y fuentes
  ├── components/       # Componentes reutilizables
  │   ├── common/       # Componentes UI básicos (Button, Input, etc.)
  │   └── layouts/      # Componentes de layout
  ├── context/          # Contextos de React (AuthContext, etc.)
  ├── hooks/            # Custom hooks
  ├── navigation/       # Configuración de React Navigation
  ├── screens/          # Pantallas de la aplicación
  │   ├── Auth/         # Pantallas de autenticación
  │   ├── Home/         # Pantallas principales
  │   └── Onboarding/   # Pantallas de onboarding
  ├── services/         # Servicios (API, etc.)
  ├── utils/            # Utilidades y helpers
  ├── constants/        # Constantes de la aplicación
  ├── styles/           # Estilos globales
  └── types/            # Tipos de TypeScript
```

## Pantallas implementadas

- **Onboarding**: Introducción a la aplicación para nuevos usuarios
- **Login**: Autenticación de usuarios
- **Home**: Pantalla principal con lista de noticias

## Requisitos

- Node.js >= 16
- Expo CLI
- iOS Simulator/Android Emulator o dispositivo físico

## Instalación

1. Clona el repositorio
2. Instala las dependencias: `npm install`
3. Inicia la aplicación: `npm start`

## Desarrollo

- `npm run ios`: Inicia la aplicación en el simulador iOS
- `npm run android`: Inicia la aplicación en el emulador Android
- `npm run web`: Inicia la aplicación en el navegador web
