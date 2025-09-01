import { HF_API_URL, HF_API_TOKEN } from '../config/aiConfig';

class SummarizationService {
  async getSummary(articleText: string): Promise<string> {
    try {
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
        console.error("HF API Error:", errorText);
        throw new Error('Failed to fetch summary from Hugging Face API.');
      }

      const data = await response.json();
      
      // Hugging Face devuelve un array con el resultado
      if (data && data[0] && data[0].summary_text) {
        return data[0].summary_text;
      } else {
        throw new Error('Invalid response format from Hugging Face API.');
      }
    } catch (error) {
      console.error("Error in SummarizationService:", error);
      throw new Error("Could not generate summary at this time.");
    }
  }
}

export const summarizationService = new SummarizationService();