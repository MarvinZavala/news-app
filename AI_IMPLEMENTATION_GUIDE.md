
# Guía de Implementación del Modelo de IA para Resumen de Noticias

Este documento describe la estrategia para implementar un modelo de Inteligencia Artificial capaz de generar resúmenes de noticias dentro de la aplicación.

## 1. Selección del Modelo

Tras un análisis de las opciones open source, el modelo seleccionado es **BART (`facebook/bart-large-cnn`)**.

### Justificación de la Elección

BART fue elegido por ser la opción más estratégica y equilibrada para este proyecto, basándose en los siguientes criterios:

1.  **Calidad y Rendimiento**: Ofrece resúmenes de texto de altísima calidad, considerándose un estándar en la industria para esta tarea. Su rendimiento es cercano al de modelos mucho más grandes.
2.  **Costo y Complejidad**: Representa el punto de equilibrio ideal. Es significativamente menos costoso y complejo de desplegar que los LLMs gigantes (como Llama 3 o GPT-4), pero mucho más potente que modelos más antiguos o pequeños.
3.  **Capacidad de Modificación (Fine-Tuning)**: Está diseñado para ser afinado. Esto es **crucial** para nuestro objetivo, ya que nos permitirá re-entrenarlo con un dataset propio para asegurar que los resúmenes sean neutrales y se ajusten a nuestro tono editorial.
4.  **Madurez y Soporte**: Al ser un modelo de Meta (Facebook AI) ampliamente adoptado, cuenta con una enorme cantidad de documentación, tutoriales y soporte de la comunidad, lo que reduce los riesgos y acelera el desarrollo.

## 2. Arquitectura de Implementación

La integración del modelo no se hará directamente en la aplicación de React Native. En su lugar, se seguirá una arquitectura cliente-servidor, que es el estándar para este tipo de tareas pesadas.

**Diagrama de Flujo:**

`[App React Native (Frontend)] <--- API REST ---> [Servidor Python (Backend con BART)]`

Esto separa la lógica de la aplicación de la lógica de la IA, permitiendo que cada parte escale de forma independiente.

### Componente 1: Creación de un Backend de IA (Nuevo Proyecto)

Se deberá crear un nuevo servicio de backend en Python.

*   **Tecnología**: **Python 3.9+** con el framework **FastAPI** (recomendado por su alto rendimiento y facilidad de uso).
*   **Librerías Clave**: `transformers`, `torch`, `fastapi`, `uvicorn`.
*   **Funcionalidad Principal**:
    1.  Cargar nuestro modelo BART afinado al iniciar el servidor.
    2.  Exponer un endpoint API, por ejemplo: `POST /summarize`.
    3.  Este endpoint recibirá el texto de un artículo en el cuerpo de la petición.
    4.  Procesará el texto con BART para generar el resumen.
    5.  Devolverá el resumen generado en formato JSON.
*   **Despliegue**: Este servidor deberá estar alojado en una plataforma que ofrezca **soporte para GPU**, como:
    *   Google Cloud Run
    *   Amazon SageMaker
    *   Hugging Face Inference Endpoints

### Componente 2: Integración en la Aplicación React Native

La aplicación actual se modificará para comunicarse con el nuevo backend de IA.

#### Paso 2.1: Nuevo Servicio - `src/services/SummarizationService.ts`

Siguiendo la arquitectura actual de tu app, crearemos un nuevo servicio para encapsular toda la lógica de comunicación con la API de IA.

*   **Archivo a Crear**: `src/services/SummarizationService.ts`
*   **Contenido de Ejemplo**:
    ```typescript
    import { AI_API_BASE_URL } from '../config/aiConfig'; // Configuración centralizada

    class SummarizationService {
      async getSummary(articleText: string): Promise<string> {
        try {
          const response = await fetch(`${AI_API_BASE_URL}/summarize`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: articleText }),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch summary from AI service');
          }

          const data = await response.json();
          return data.summary;
        } catch (error) {
          console.error("Error in SummarizationService:", error);
          // Devolver un mensaje de error amigable o re-lanzar el error
          throw new Error("Could not generate summary.");
        }
      }
    }

    export const summarizationService = new SummarizationService();
    ```

#### Paso 2.2: Nueva Configuración - `src/config/aiConfig.ts`

Para evitar tener URLs hardcodeadas en el código, añadiremos un archivo de configuración.

*   **Archivo a Crear**: `src/config/aiConfig.ts`
*   **Contenido de Ejemplo**:
    ```typescript
    // URL base del backend de IA desplegado
    export const AI_API_BASE_URL = 'https://tu-servicio-de-ia.deploy.com';
    ```

#### Paso 2.3: Modificación de Pantallas - `src/screens/News/NewsDetailsScreen.tsx`

La pantalla de detalles de la noticia será la encargada de solicitar y mostrar el resumen.

*   **Archivo a Modificar**: `src/screens/News/NewsDetailsScreen.tsx`
*   **Lógica a Añadir**:
    1.  Importar el nuevo `summarizationService`.
    2.  Añadir un nuevo estado para almacenar el resumen y el estado de carga.
        ```typescript
        const [summary, setSummary] = useState<string | null>(null);
        const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
        ```
    3.  Usar un `useEffect` para llamar al servicio cuando la pantalla carga los datos de la noticia.
        ```typescript
        useEffect(() => {
          if (story && story.content) {
            const fetchSummary = async () => {
              setIsSummaryLoading(true);
              try {
                const generatedSummary = await summarizationService.getSummary(story.content);
                setSummary(generatedSummary);
              } catch (error) {
                console.error(error);
                setSummary("No se pudo generar el resumen en este momento.");
              } finally {
                setIsSummaryLoading(false);
              }
            };
            fetchSummary();
          }
        }, [story]); // Se ejecuta cuando 'story' se carga
        ```
    4.  Renderizar el resumen en la UI, mostrando un indicador de carga mientras se genera.

## 3. Flujo de Datos Final

1.  El usuario navega a la pantalla `NewsDetailsScreen`.
2.  La pantalla carga los datos de la noticia desde Firebase a través de `NewsService`.
3.  El `useEffect` se activa y llama a `summarizationService.getSummary()` con el texto del artículo.
4.  `SummarizationService` envía una petición `POST` al backend de Python.
5.  El servidor Python procesa la petición con el modelo BART y devuelve el resumen.
6.  La app React Native recibe el resumen, lo guarda en el estado y lo muestra en la interfaz.
