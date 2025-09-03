import Constants from 'expo-constants';

// Configuración para Hugging Face Inference API
export const HF_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";

// Verificamos que el token exista y no esté vacío
const token = Constants.expoConfig?.extra?.HF_API_TOKEN;
export const HF_API_TOKEN = token || "";

// Helper para verificar si el token es válido
export const isValidToken = () => {
  return HF_API_TOKEN && HF_API_TOKEN.length > 0 && HF_API_TOKEN !== "your_huggingface_token_here";
};