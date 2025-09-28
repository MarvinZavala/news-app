# Guía de Despliegue a TestFlight

Esta guía explica cómo generar y publicar builds de la app en TestFlight usando Expo Application Services (EAS).

## 1. Requisitos previos

- Cuenta activa del Apple Developer Program (99 USD/año).
- App creada en App Store Connect con el mismo `bundleIdentifier` definido en `app.json` (`com.marcosandoval627.newsapp`).
- EAS CLI instalada: `npm install -g eas-cli`.
- Acceso al equipo de Expo (propietario `marcosandoval627`). Si no tienes acceso, solicita invitación.
- API keys y secretos configurados en EAS (`EXPO_PUBLIC_ANTHROPIC_API_KEY`, `HF_API_TOKEN`). Usa `eas secret:create` para evitar exponerlos en el repositorio.

## 2. Actualizar metadatos antes de cada build

1. Ajusta `expo.version` y `expo.ios.buildNumber` en `app.json`.
   - Usa formato `1.0.1` para `version` y un numérico creciente como `1.0.1` para `buildNumber`.
   - El perfil de producción (`eas.json`) tiene `autoIncrement` activo; al lanzar un nuevo build incrementará automáticamente el `buildNumber` remoto, pero define el valor inicial manualmente si es el primer envío.
2. Confirma que los mensajes de permisos (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSMicrophoneUsageDescription`) describen con precisión el uso real del flujo de envío de noticias (captura de fotos/videos y audio).
3. Comprueba que `runtimeVersion.policy` permanece en `appVersion` para mantener compatibilidad con OTA updates.

## 3. Preparar credenciales de Apple

1. Ejecuta `eas login` para autenticarte en Expo.
2. Con `eas build:configure` crea el proyecto remoto si es la primera vez.
3. Durante el primer `eas build`, Expo generará automáticamente certificados de distribución, perfiles de aprovisionamiento y claves `push`. Acepta la opción automática salvo que el equipo ya tenga certificados gestionados manualmente.
4. Si App Store Connect exige autenticación en dos factores, genera una contraseña específica de app y proporciónala cuando `eas submit` la solicite.

## 4. Generar el build para TestFlight

Ejecuta:

```bash
eas build --platform ios --profile production
```

Notas:
- El perfil `production` usa `distribution: store` y el `channel` `production`, adecuado para TestFlight/App Store.
- La primera ejecución puede tardar ~10-15 minutos. El comando imprimirá la URL del job para seguir el progreso.
- Descarga el `.ipa` si necesitas subirlo manualmente (`eas build:download --platform ios`).

## 5. Enviar el build a TestFlight

Una vez completado el build, lanza:

```bash
eas submit --platform ios --profile production
```

Sigue los prompts:
- Introduce el Apple ID asociado y la contraseña específica de app (no la contraseña normal).
- Selecciona la app correcta en App Store Connect (por `bundleIdentifier`).
- Al finalizar, App Store Connect procesará el binario (puede tardar hasta 30 minutos).

## 6. Configurar pruebas en TestFlight

1. En App Store Connect abre la sección **TestFlight**.
2. Añade el build recién subido a un grupo de testers internos o externos.
3. Para testers externos completa la ficha de revisión (Descripción, Cambios, Compliance) y envía a revisión de Apple.
4. Apple aprobará el build para TestFlight (normalmente <24h). Luego invita testers externos mediante enlaces o correo.

## 7. Buenas prácticas

- Mantén un changelog y adjúntalo en la sección "Qué hay de nuevo" de TestFlight.
- Ejecuta `expo prebuild --platform ios` únicamente si necesitas personalizar nativamente el proyecto; para builds estándar no es necesario.
- Después de cada versión aceptada en App Store, sincroniza manualmente el `buildNumber` para evitar conflictos.
- Usa `eas branch:create production` y `eas update --branch production --message "..."` si planeas distribuir actualizaciones OTA.

## 8. Resolución de problemas comunes

- **Credenciales inválidas**: Vuelve a ejecutar `eas credentials` y elimina certificados antiguos desde App Store Connect > Users and Access > Keys.
- **Permisos faltantes**: Si Apple rechaza el build por permisos, ajusta los textos en `app.json` y sube un nuevo build.
- **Errores de dependencias nativas**: Revisa el log del build (`eas build:view`) y asegura que los plugins/expo-modules utilizados soportan iOS.
- **Variables de entorno vacías**: Confirma con `eas secrets:list` que los secretos están asignados al proyecto y perfil.

Siguiendo estos pasos deberías poder publicar builds en TestFlight sin inconvenientes.
