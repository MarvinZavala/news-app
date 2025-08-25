# News App - Architecture Overview

## 📱 **App Overview**
Esta es una aplicación de noticias estilo Ground News que permite a los usuarios leer, evaluar y discutir noticias con un enfoque en el análisis de sesgo político y credibilidad. La app está construida con React Native + Expo y utiliza Firebase como backend.

## 🏗️ **Estructura General del Proyecto**

### **Core Technologies**
- **Frontend**: React Native + Expo
- **Backend**: Firebase (Firestore, Authentication)
- **Navigation**: React Navigation
- **State Management**: React Context + useState/useEffect
- **UI**: React Native + Ionicons

## 📂 **Arquitectura de Archivos Principales**

### **🔥 Firebase Configuration**
- **`src/config/firebase.ts`**: Configuración de Firebase, inicializa Firestore y Authentication

### **🎯 Types & Interfaces**
- **`src/types/news.ts`**: Define todas las interfaces principales
  - `NewsStory`: Estructura completa de una noticia con bias, credibilidad, fuentes
  - `UserVote`: Estructura de votos de usuarios
  - `Comment`: Sistema de comentarios anidados
  - `BiasScore`: Distribución de sesgo político (left/center/right)

- **`src/types/navigation.ts`**: Define rutas y parámetros de navegación
  - Stack navigation para diferentes secciones
  - Parámetros que se pasan entre pantallas

### **🔐 Authentication Context**
- **`src/context/AuthContext.tsx`**: Maneja autenticación global
  - Login/logout de usuarios
  - Estado de autenticación persistente
  - Información del usuario actual

## 🛠️ **Services Layer (Lógica de Negocio)**

### **📰 NewsService**
- **`src/services/NewsService.ts`**: Servicio principal de noticias
  - **Funcionalidades**:
    - Cargar noticias con filtros (categoría, sesgo, credibilidad)
    - Suscripciones en tiempo real a noticias
    - Búsqueda de noticias
    - Incrementar contadores (views, shares)
    - **Submisión de noticias por usuarios** con múltiples fuentes
    - Cálculo de sesgo inicial basado en fuentes
    - Estadísticas de contribuciones de usuarios

### **🗳️ VotingService**
- **`src/services/VotingService.ts`**: Sistema de votación comunitaria
  - **Funcionalidades**:
    - Votar en sesgo político (left/center/right)
    - Calificar credibilidad (1-5 estrellas)
    - Calificar calidad general (1-5 estrellas)
    - Estadísticas agregadas de votos
    - Prevenir votos duplicados
    - Actualizar estadísticas de noticias automáticamente
    - Historial de votos por usuario

### **💬 CommentService**
- **`src/services/CommentService.ts`**: Sistema de comentarios
  - **Funcionalidades**:
    - Comentarios anidados (threading)
    - Sistema de likes/dislikes
    - Respuestas a comentarios
    - Moderación básica
    - Conteo de engagement

## 🖥️ **Screens (Pantallas Principales)**

### **📱 NewsDetailsScreen**
- **Ubicación**: `src/screens/News/NewsDetailsScreen.tsx`
- **Funcionalidad**: Pantalla principal de detalle de noticia
- **Características**:
  - Header flotante que aparece al hacer scroll
  - Hero section con metadata mejorada
  - Diseño de tarjetas para mejor jerarquía visual
  - Visualización de fuentes con indicadores de bias
  - Estadísticas de engagement
  - Integración con sistema de votación y comentarios
  - Estados de carga profesionales

### **✍️ SubmitNewsScreen**
- **Ubicación**: `src/screens/Submit/SubmitNewsScreen.tsx`
- **Funcionalidad**: Permite a usuarios enviar noticias
- **Características**:
  - Formulario profesional con validación
  - Soporte para múltiples fuentes URLs
  - Sistema de tags dinámicos
  - Evaluación de bias sugerido
  - Calificación de credibilidad
  - Niveles de urgencia (normal/breaking/developing)
  - Reputación de fuentes (verified/questionable/unknown)

## 🧩 **Components (Componentes Reutilizables)**

### **🃏 NewsCard**
- **Ubicación**: `src/components/NewsCard.tsx`
- **Funcionalidad**: Tarjeta de noticia para listas
- **Características**:
  - Visualización de bias con barras de colores
  - Badges para breaking news, trending, verified sources
  - Sistema de estrellas para credibilidad
  - Indicadores de fuentes múltiples
  - Estadísticas de engagement
  - Indicadores para contenido generado por usuarios

### **🗳️ CommunityVoting**
- **Ubicación**: `src/components/CommunityVoting.tsx`
- **Funcionalidad**: Sistema de votación comunitaria
- **Características**:
  - **Panel de votación limpio** que aparece después del header
  - **Proceso simplificado**: 3 preguntas (sesgo, credibilidad, calidad)
  - **Estrellas grandes** para fácil interacción móvil
  - **Resultados visuales** con barras de bias combinadas
  - **Estados dinámicos**: muestra panel de voto O resultados, no ambos
  - **Feedback inmediato** en las interacciones
  - **Condicional rendering** para optimizar espacio

### **💬 CommentSection**
- **Ubicación**: `src/components/CommentSection.tsx`
- **Funcionalidad**: Sistema completo de comentarios
- **Características**:
  - Comentarios anidados (threading)
  - Botones de like/dislike
  - Formulario de respuesta in-line
  - Estados de carga y error
  - Integración con autenticación

## 🌊 **Flujo de Usuario Principal**

### **1. Lectura de Noticias**
1. Usuario abre app y ve lista de noticias (NewsCard components)
2. Cada tarjeta muestra bias, credibilidad, fuentes, engagement
3. Usuario toca una noticia → navega a NewsDetailsScreen
4. Ve contenido completo con fuentes, estadísticas, comentarios

### **2. Sistema de Evaluación Comunitaria**
1. En NewsDetailsScreen, usuario ve resultados de votación actuales
2. Si está autenticado, puede tocar "Vote Now"
3. Panel de votación aparece INMEDIATAMENTE después del header
4. Usuario califica: sesgo político + credibilidad + calidad
5. Al enviar, panel se cierra y muestra resultados actualizados
6. VotingService actualiza automáticamente las estadísticas

### **3. Envío de Noticias por Usuarios**
1. Usuario navega a SubmitNewsScreen
2. Llena formulario: título, URL principal, resumen, categoría
3. Puede agregar fuentes adicionales, tags, evaluación de bias
4. NewsService procesa el envío y calcula bias inicial
5. Historia aparece inmediatamente en el feed principal

### **4. Sistema de Comentarios**
1. En NewsDetailsScreen, usuario ve sección de comentarios
2. Puede escribir comentarios, responder a otros, dar like/dislike
3. CommentService maneja threading y estadísticas
4. Actualizaciones en tiempo real

## 🎨 **Diseño y UX**

### **Design System**
- **Colores principales**: Grises sutiles (#F8FAFC, #64748B, #1E293B)
- **Botón primario**: Negro (#0F172A)
- **Estados**: Verde para verificado, rojo/azul para sesgo político
- **Tipografía**: Pesos 400-600, tamaños 11-20px
- **Espaciado**: Sistema consistente de 4px, 8px, 12px, 16px, 20px

### **UX Patterns**
- **Tarjetas con sombras sutiles** para jerarquía
- **Estados de carga profesionales** con shimmer effects
- **Feedback inmediato** en todas las interacciones
- **Navegación clara** con headers flotantes
- **Responsive design** adaptado para móviles

## 🔄 **Real-time Features**

### **Firebase Subscriptions**
- **NewsService**: Suscripciones en tiempo real a cambios en noticias
- **VotingService**: Actualización automática de estadísticas
- **CommentService**: Comentarios y likes en tiempo real

### **State Management**
- **AuthContext**: Estado global de autenticación
- **Local State**: useState/useEffect para estado de componentes
- **Optimistic Updates**: UI se actualiza antes de confirmación de servidor

## 🚀 **Funcionalidades Clave Implementadas**

✅ **Completamente Funcional:**
- Sistema de autenticación Firebase
- CRUD completo de noticias
- Votación comunitaria con estadísticas
- Comentarios con threading
- Envío de noticias por usuarios
- UI/UX moderna y responsiva
- Real-time updates

✅ **Recientemente Mejorado:**
- CommunityVoting component completamente rediseñado
- NewsDetailsScreen modernizado
- SubmitNewsScreen profesional
- Mejor arquitectura de estilos

## 📊 **Data Flow**

1. **Firebase Firestore** almacena todas las noticias, votos, comentarios
2. **Services** proporcionan abstracción y lógica de negocio
3. **Components** consumen services y manejan UI
4. **Context** maneja estado global (auth)
5. **Real-time subscriptions** mantienen UI sincronizada

La app está estructurada de manera profesional, escalable y siguiendo mejores prácticas de React Native y Firebase.