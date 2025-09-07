import Constants from 'expo-constants';

// Configuración para Hugging Face Inference API - Modelo que realmente funciona
export const HF_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";

// Intentar obtener el token desde diferentes fuentes soportadas por Expo/EAS
const extra = (Constants as any)?.expoConfig?.extra
  || (Constants as any)?.manifest2?.extra
  || (Constants as any)?.manifest?.extra
  || {};

const tokenFromExtra = extra?.HF_API_TOKEN;
export const HF_API_TOKEN = tokenFromExtra || "";

// Helper para verificar si el token es válido
export const isValidToken = () => {
  return typeof HF_API_TOKEN === 'string' && HF_API_TOKEN.length > 0 && HF_API_TOKEN !== 'your_huggingface_token_here';
};

// Endpoint del modelo Zero-Shot para bias (inglés). Cambiable sin tocar código.
// Opciones confiables (no 404):
// - "https://api-inference.huggingface.co/models/microsoft/deberta-v3-base-mnli" (recomendado)
// - "https://api-inference.huggingface.co/models/microsoft/deberta-v3-large-mnli"
// - "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
export const HF_ZERO_SHOT_URL = (extra?.HF_ZERO_SHOT_URL as string)
  || 'https://api-inference.huggingface.co/models/microsoft/deberta-v3-base-mnli';
