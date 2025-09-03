import { HF_API_URL, HF_API_TOKEN, isValidToken } from '../config/aiConfig';

class SummarizationService {
  async getSummary(articleText: string): Promise<string> {
    try {
      // Verificar primero si tenemos un token válido
      if (!isValidToken()) {
        console.error("HF API Error: No valid API token provided");
        throw new Error('No valid Hugging Face API token configured. Please add your token to .env.local file.');
      }

      // Preparar texto para Hugging Face API
      const truncatedText = articleText.substring(0, 1024); // Limitar a 1024 caracteres
      
      const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${HF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: truncatedText,
          parameters: {
            max_length: 130,
            min_length: 50,
            do_sample: false
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