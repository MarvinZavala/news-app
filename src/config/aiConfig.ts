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

// Claude Haiku Configuration for Bias Analysis
// Try from environment variables first, then from expo config
export const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || extra?.ANTHROPIC_API_KEY || "";

// Anthropic Configuration - Claude Haiku for bias detection
export const ANTHROPIC_CONFIG = {
  apiUrl: 'https://api.anthropic.com/v1/messages',
  model: 'claude-3-haiku-20240307', // Optimized for bias analysis
  maxTokens: 1000,
  temperature: 0.1, // Low temperature for consistent analysis
  timeout: 30000,
};

// Bias detection configuration - Claude only
export const BIAS_CONFIG = {
  maxTextLength: 4000, // Optimized for Claude Haiku cost/performance
  retryAttempts: 2,
  retryDelay: 1000,
};

// Helper to check if Claude Haiku is available
export const hasClaudeAPI = () => {
  return ANTHROPIC_API_KEY && ANTHROPIC_API_KEY.length > 0;
};
