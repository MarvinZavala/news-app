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
      const promptPrefix = 'Summarize the following news content: ';
      const titlePrefix = title ? `${title}. ` : '';
      const fullText = promptPrefix + titlePrefix + articleText;
      // BART maneja ~1024 tokens de entrada; usamos ~3000 chars como heurística conservadora
      const truncatedText = fullText.length > 3000 ? fullText.slice(0, 3000) : fullText;
      
      // Pequeño helper de reintento para cold start (503/model loading)
      const callApi = async (): Promise<Response> => {
        return fetch(HF_API_URL, {
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
            do_sample: false,
            length_penalty: 2.0,
            no_repeat_ngram_size: 3
            }
        }),
      });
      };

      let response = await callApi();
      // Manejar cold starts: algunos endpoints devuelven 503 con mensaje de loading
      if (!response.ok && (response.status === 503 || response.status === 524)) {
        // Esperar y reintentar una vez
        await new Promise((res) => setTimeout(res, 2000));
        response = await callApi();
      }

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

      // Algunos errores vienen como objeto con propiedad 'error'
      if (data && data.error) {
        const errMsg = String(data.error).toLowerCase();
        if (errMsg.includes('loading')) {
          // Un intento extra si el modelo estaba cargando
          await new Promise((res) => setTimeout(res, 1500));
          const retry = await callApi();
          if (!retry.ok) {
            throw new Error('Hugging Face model still loading. Please try again.');
          }
          const retryData = await retry.json();
          if (retryData && retryData[0]?.summary_text) {
            return retryData[0].summary_text as string;
          }
        }
        throw new Error(data.error);
      }
      
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
