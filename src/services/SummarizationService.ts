import { HF_API_URL, HF_API_TOKEN, isValidToken } from '../config/aiConfig';

class SummarizationService {
  async getSummary(articleText: string): Promise<string> {
    try {
      // Verificar primero si tenemos un token válido
      if (!isValidToken()) {
        console.error("HF API Error: No valid API token provided");
        throw new Error('No valid Hugging Face API token configured. Please add your token to .env.local file.');
      }

      // Preparar texto para Hugging Face API - texto más largo para mejor contexto
      const truncatedText = articleText.substring(0, 2048); // Aumentar a 2048 caracteres
      
      const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${HF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: truncatedText,
          parameters: {
            max_length: 80,    // Resúmenes más cortos
            min_length: 30,    // Mínimo más bajo
            do_sample: true,   // Activar sampling para diversidad
            temperature: 0.7,  // Agregar creatividad controlada
            repetition_penalty: 1.2, // Evitar repetición
            length_penalty: 2.0,      // Favorecer resúmenes concisos
            no_repeat_ngram_size: 3   // Evitar repetir frases
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HF API Error:", typeof errorText === 'string' ? errorText : JSON.stringify(errorText));
        
        // Mensajes de error más específicos según el status code
        if (response.status === 401) {
          throw new Error('Authentication failed: Invalid Hugging Face API token.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded for Hugging Face API.');
        } else {
          throw new Error(`Hugging Face API error (${response.status}): Failed to fetch summary.`);
        }
      }

      const data = await response.json();
      
      // Hugging Face devuelve un array con el resultado
      if (data && data[0] && data[0].summary_text) {
        return data[0].summary_text;
      } else {
        console.error("Invalid response format:", JSON.stringify(data));
        throw new Error('Invalid response format from Hugging Face API.');
      }
    } catch (error) {
      console.error("Error in SummarizationService:", error);
      throw new Error("Could not generate summary at this time.");
    }
  }
}

export const summarizationService = new SummarizationService();