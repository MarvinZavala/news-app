import Constants from 'expo-constants';

// Configuración para Hugging Face Inference API
export const HF_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
export const HF_API_TOKEN = Constants.expoConfig?.extra?.HF_API_TOKEN || ""; // Token from expo constants