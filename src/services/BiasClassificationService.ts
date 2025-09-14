import { ANTHROPIC_API_KEY, ANTHROPIC_CONFIG, BIAS_CONFIG, hasClaudeAPI } from '../config/aiConfig';
import { getEnhancedBiasPrompt } from '../config/biasPrompt';
import {
  EnhancedBiasResult,
  EnhancedBiasAnalysis,
  convertToLegacyBiasScore,
  getDetectedBias
} from '../types/enhancedBias';

export interface BiasResult {
  left: number;   // 0-100
  center: number; // 0-100
  right: number;  // 0-100
  detectedBias: 'left' | 'center' | 'right';
  confidence: number; // 0-1
  // Enhanced fields
  justification?: string;
  aligned_elements?: string[];
  provider?: string;
}

class BiasClassificationService {
  // Enhanced Anthropic analysis with Claude Haiku
  private async analyzeWithClaude(text: string): Promise<EnhancedBiasAnalysis> {
    const startTime = Date.now();

    const prompt = getEnhancedBiasPrompt(text);

    const response = await fetch(ANTHROPIC_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_CONFIG.model,
        max_tokens: ANTHROPIC_CONFIG.maxTokens,
        temperature: ANTHROPIC_CONFIG.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      throw new Error('No content in Claude response');
    }

    try {
      const result: EnhancedBiasResult = JSON.parse(content);

      return {
        ...result,
        provider: 'anthropic',
        processingTime: Date.now() - startTime,
        textLength: text.length,
        truncated: text.length > BIAS_CONFIG.maxTextLength,
        retryCount: 0,
      };
    } catch (parseError) {
      throw new Error(`Failed to parse Claude JSON response: ${parseError}`);
    }
  }

  // Main classify method - Claude Haiku only
  async classify(text: string): Promise<BiasResult> {
    const input = (text || '').trim();
    if (!input) {
      throw new Error('Empty text provided for bias classification');
    }

    // Check if Claude API is available
    if (!hasClaudeAPI()) {
      throw new Error('Claude Haiku API key not configured. Bias analysis requires Anthropic API key.');
    }

    // Truncate text if too long
    const truncated = input.length > BIAS_CONFIG.maxTextLength ?
      input.slice(0, BIAS_CONFIG.maxTextLength) : input;

    let retryCount = 0;
    const maxRetries = BIAS_CONFIG.retryAttempts;

    while (retryCount <= maxRetries) {
      try {
        const result = await this.analyzeWithClaude(truncated);

        // Convert enhanced result to legacy format for compatibility
        const legacyBias = convertToLegacyBiasScore(result.bias_score);
        return {
          ...legacyBias,
          detectedBias: getDetectedBias(result.bias_score),
          confidence: result.confidence,
          justification: result.justification,
          aligned_elements: result.aligned_elements,
          provider: result.provider,
        };

      } catch (error) {
        console.warn(`Claude bias analysis failed (attempt ${retryCount + 1}):`, error);

        retryCount++;

        // If we've exhausted retries, throw error
        if (retryCount > maxRetries) {
          throw new Error(`Claude bias analysis failed after ${maxRetries} attempts: ${error}`);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, BIAS_CONFIG.retryDelay));
      }
    }

    throw new Error(`Max retries (${maxRetries}) exceeded for bias classification`);
  }
}

export const biasClassificationService = new BiasClassificationService();