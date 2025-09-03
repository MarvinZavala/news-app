import { HF_API_URL, HF_API_TOKEN, isValidToken } from '../config/aiConfig';

class SummarizationService {
  async getSummary(articleText: string, title?: string): Promise<string> {
    try {
      // Verificar primero si tenemos un token válido
      if (!isValidToken()) {
        console.error("HF API Error: No valid API token provided");
        throw new Error('No valid Hugging Face API token configured. Please add your token to .env.local file.');
      }

      // Preparar texto para Hugging Face API - optimizado para resumir puntos clave
      const promptPrefix = 'Key points to summarize: ';
      const titlePrefix = title ? `${title}. ` : '';
      const fullText = promptPrefix + titlePrefix + articleText;
      const truncatedText = fullText.substring(0, 1024);
      
      const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${HF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: truncatedText,
          parameters: {
            max_length: 80,     // Más corto para forzar síntesis
            min_length: 25,     // Mínimo para evitar muy corto
            do_sample: true,    // Activar sampling para creatividad
            temperature: 0.8,   // Creatividad moderada para parafrasear
            top_k: 50,         // Limitar opciones para coherencia
            repetition_penalty: 1.3, // Penalizar repetición de texto original
            length_penalty: 2.0,     // Favorecer resúmenes concisos
            no_repeat_ngram_size: 3  // Evitar copiar frases del original
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