# Documentación Detallada de la Aplicación de Noticias

Este documento proporciona un análisis exhaustivo de la arquitectura, tecnologías, estructura de archivos y funcionalidades de la aplicación de noticias.

## 1. Visión General y Tecnologías

La aplicación es una plataforma de noticias construida con **React Native** y **Expo**. Su objetivo es permitir a los usuarios leer, discutir y evaluar noticias, con un fuerte enfoque en el análisis de sesgo político y la credibilidad, fomentando la participación comunitaria.

### Tecnologías Clave
- **Framework**: React Native + Expo
- **Lenguaje**: TypeScript
- **Navegación**: React Navigation (`@react-navigation/native`, `stack`, `bottom-tabs`)
- **Backend y Base de Datos**: Firebase (Authentication para usuarios, Firestore para datos en tiempo real)
- **Gestión de Estado**: React Context API (`AuthContext`, `OnboardingContext`, `BookmarkContext`)
- **Componentes UI**: Componentes nativos, `@expo/vector-icons` (específicamente `Ionicons`).
- **Animaciones**: `lottie-react-native` para animaciones complejas (ej. onboarding).
- **Almacenamiento Local**: `@react-native-async-storage/async-storage` para persistir datos como el estado de onboarding y la sesión de Firebase en el dispositivo.

---

## 2. Archivos de Configuración (Raíz del Proyecto)

Estos archivos configuran el entorno de desarrollo, las dependencias y el comportamiento general de la aplicación.

- **`.gitignore`**: Especifica los archivos y carpetas que Git debe ignorar (ej. `node_modules/`, `.expo/`).
- **`app.json`**: Archivo de configuración de Expo. Define metadatos como el nombre de la app, el ícono, la pantalla de bienvenida (splash screen), y las configuraciones específicas de cada plataforma (iOS/Android).
- **`App.tsx`**: **Punto de entrada principal de la aplicación**. Su única responsabilidad es configurar los proveedores de contexto (`SafeAreaProvider`, `AuthProvider`, `OnboardingProvider`) y renderizar el navegador principal (`AppNavigator`).
- **`babel.config.js`**: Configuración para Babel, el transpilador de JavaScript. Se usa para compatibilidad y para habilitar plugins como `babel-plugin-module-resolver`.
- **`index.ts`**: Punto de entrada para el registro de la aplicación en Expo.
- **`package.json`**: Define las dependencias del proyecto (React, Expo, Firebase, etc.), los scripts de ejecución (`start`, `android`, `ios`) y la versión de la app.
- **`package-lock.json`**: Registra las versiones exactas de cada dependencia instalada para garantizar compilaciones consistentes.
- **`tsconfig.json`**: Archivo de configuración de TypeScript. Define las reglas del compilador, como las rutas base, la versión de JS de salida y las opciones de chequeo de tipos.

---

## 3. Análisis Detallado de la Carpeta `src`

Aquí reside toda la lógica y la interfaz de usuario de la aplicación.

### `src/assets`
Contiene todos los recursos estáticos.
- **`fonts/`**: Para fuentes personalizadas.
- **`icons/`**: Iconos específicos de la aplicación.
- **`images/`**: Imágenes generales.
- **`onboardingscreen/welcomenews.json`**: Archivo de animación Lottie para la pantalla de bienvenida.

### `src/components`
Componentes de UI reutilizables, organizados por tipo.
- **`CommentSection.tsx`**: Un componente complejo que encapsula toda la lógica para mostrar y enviar comentarios, incluyendo respuestas anidadas.
- **`CommunityVoting.tsx`**: Componente para que los usuarios voten sobre el sesgo, la credibilidad y la calidad de una noticia.
- **`NewsCard.tsx`**: **Componente clave**. Es la tarjeta que se muestra en las listas de noticias. Presenta de forma visualmente atractiva el título, resumen, categoría, y métricas complejas como el sesgo político (con barras de colores), la credibilidad (con estrellas) y el engagement.
- **`common/Button.tsx`**: Un componente de botón base, probablemente personalizable para diferentes usos en la app.
- **`ui/`**: Componentes de UI más específicos.
  - **`ActionButton.tsx`**: Botón de acción, posiblemente con ícono y texto.
  - **`AnimatedCard.tsx`**: Una tarjeta con animaciones.
  - **`Card.tsx`**: Un componente base de tarjeta para estandarizar el layout.
  - **`Header.tsx`**: Un componente de cabecera reutilizable.

### `src/config`
- **`firebase.ts`**: **Archivo crítico**. Inicializa la conexión con Firebase usando las credenciales del proyecto. Configura y exporta las instancias de `auth` (para autenticación, con persistencia en `AsyncStorage`) y `db` (para la base de datos Firestore).

### `src/context`
Gestión de estado global mediante la Context API de React.
- **`AuthContext.tsx`**: Provee el estado de autenticación (`user`, `isLoading`) y las funciones (`login`, `logout`, `register`) a toda la app. Escucha los cambios de Firebase Auth en tiempo real.
- **`BookmarkContext.tsx`**: Gestiona el estado de las noticias guardadas (marcadores).
- **`OnboardingContext.tsx`**: Maneja si el usuario ya ha completado el flujo de introducción.

### `src/hooks`
Hooks personalizados para encapsular lógica reutilizable.
- **`useOnboarding.ts`**: Un hook que abstrae la lógica de comprobar y guardar el estado de finalización del onboarding en `AsyncStorage`. Devuelve el estado de carga y si el onboarding se ha completado.

### `src/navigation`
Define toda la estructura de navegación de la aplicación.
- **`AppNavigator.tsx`**: El navegador raíz. Utiliza los hooks `useAuth` y `useOnboarding` para decidir qué flujo mostrar: `OnboardingScreen`, `AuthNavigator` (si no está logueado) o `MainTabNavigator` (si está logueado).
- **`AuthNavigator.tsx`**: Stack navigator para el flujo de autenticación, contiene las pantallas de `Login`, `Register` y `ForgotPassword`.
- **`MainTabNavigator.tsx`**: Un Bottom Tab Navigator que es la interfaz principal para usuarios logueados. Contiene las siguientes pestañas, cada una renderizando su propio Stack Navigator:
  - `HomeTab` (`HomeStackNavigator`)
  - `SubmitTab` (`SubmitStackNavigator`)
  - `SearchTab` (`SearchStackNavigator`)
  - `BookmarksTab` (`BookmarksStackNavigator`)
  - `ProfileTab` (`ProfileStackNavigator`)
- **`stacks/`**: Define las pilas de navegación para cada pestaña.
  - **`BookmarksStackNavigator.tsx`**: Navegación para ver la lista de marcadores y sus detalles.
  - **`HomeStackNavigator.tsx`**: Navegación para el feed principal. Va desde la lista de noticias (`NewsListScreen`) a los detalles (`NewsDetailsScreen`) y comentarios (`NewsCommentsScreen`).
  - **`ProfileStackNavigator.tsx`**: Navegación para todas las pantallas relacionadas con el perfil del usuario.
  - **`SearchStackNavigator.tsx`**: Navegación para la búsqueda, resultados y filtros.
  - **`SubmitStackNavigator.tsx`**: Navegación para el flujo de envío de noticias.

### `src/screens`
Contiene todas las pantallas de la aplicación, organizadas por funcionalidad.
- **`Auth/`**: Pantallas de `LoginScreen`, `RegisterScreen`, `ForgotPasswordScreen`.
- **`Bookmarks/`**: Pantallas para gestionar marcadores: `BookmarksListScreen`, `BookmarkDetailsScreen`, etc.
- **`Home/`**: (Actualmente vacío, la lógica principal está en `News/`).
- **`News/`**:
  - **`NewsListScreen.tsx`**: Muestra la lista principal de noticias usando `NewsCard`.
  - **`NewsDetailsScreen.tsx`**: **Pantalla clave**. Muestra el contenido completo de una noticia, integra el componente `CommunityVoting` y `CommentSection`.
  - **`NewsCommentsScreen.tsx`**: Pantalla dedicada a los comentarios de una noticia.
- **`Onboarding/OnboardingScreen.tsx`**: Pantalla de introducción para nuevos usuarios, utiliza la animación Lottie.
- **`Profile/`**: Múltiples pantallas para la gestión del perfil: `ProfileScreen` (principal), `EditProfileScreen`, `SettingsScreen`, `ChangePasswordScreen`, etc.
- **`Search/`**: Pantallas para la funcionalidad de búsqueda: `SearchScreen`, `SearchResultsScreen`, `SearchFiltersScreen`.
- **`Submit/`**: Pantallas para el envío de noticias: `SubmitNewsScreen`, `SubmitPreviewScreen`, `SubmitSuccessScreen`.

### `src/services`
Capa de abstracción para la lógica de negocio y la comunicación con el backend (Firebase).
- **`BookmarkService.ts`**: Lógica para añadir, eliminar y obtener los marcadores de un usuario.
- **`CommentService.ts`**: Lógica para enviar, obtener y gestionar los comentarios y respuestas.
- **`NewsService.ts`**: Lógica para obtener noticias, realizar búsquedas y gestionar el envío de noticias por parte de los usuarios.
- **`SeedDataService.ts`**: Probablemente un servicio para poblar la base de datos con datos de prueba.
- **`VotingService.ts`**: Lógica para registrar los votos de los usuarios y recalcular las estadísticas de sesgo y credibilidad de una noticia.

### `src/styles`
(Actualmente vacío) Destinado a contener estilos globales, temas o constantes de diseño si fuera necesario.

### `src/types`
Define las interfaces y tipos de TypeScript para garantizar la consistencia de los datos en toda la aplicación.
- **`navigation.ts`**: Define los tipos para cada navegador y sus parámetros de ruta. Esencial para la seguridad de tipos en la navegación (ej. `RootStackParamList`, `HomeStackParamList`).
- **`news.ts`**: **Archivo fundamental**. Define las estructuras de datos principales que se usan en Firestore y en la app, como `NewsStory`, `UserVote`, `Comment`, `BiasScore`, etc.

### `src/utils`
Funciones de utilidad que pueden ser usadas en cualquier parte de la aplicación.
- **`firebaseHelpers.ts`**: Funciones auxiliares específicas para trabajar con Firebase.

---
Esta estructura modular y bien definida facilita la escalabilidad y el mantenimiento de la aplicación, separando claramente las responsabilidades de cada parte del código.