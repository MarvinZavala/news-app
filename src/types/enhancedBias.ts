/**
 * Enhanced Bias Detection Types
 */

export interface EnhancedBiasResult {
  bias_score: number;          // -1.0 to +1.0 scale
  label: string;               // Human readable label
  justification: string;       // Detailed explanation
  aligned_elements: string[];  // Specific elements that indicate bias
  confidence: number;          // 0-1 confidence score
}

export interface EnhancedBiasAnalysis extends EnhancedBiasResult {
  // Additional metadata for internal use
  provider: 'anthropic'; // Claude Haiku only
  processingTime: number;      // Time taken in milliseconds
  textLength: number;          // Original text length
  truncated: boolean;          // Whether text was truncated
  retryCount: number;          // Number of retries needed
}

// Bias labels mapping for consistency
export const BIAS_LABELS = {
  '-1.0': 'Strong Left Bias',
  '-0.8': 'Strong Left Bias',
  '-0.6': 'Moderate Left Bias',
  '-0.4': 'Moderate Left Bias',
  '-0.2': 'Slight Left Bias',
  '0.0': 'Center/Neutral',
  '0.2': 'Slight Right Bias',
  '0.4': 'Moderate Right Bias',
  '0.6': 'Moderate Right Bias',
  '0.8': 'Strong Right Bias',
  '1.0': 'Strong Right Bias',
} as const;

// Convert bias score to normalized bias distribution for backwards compatibility
export const convertToLegacyBiasScore = (biasScore: number): {
  left: number;
  center: number;
  right: number;
} => {
  // Normalize bias_score (-1 to +1) to percentage distribution
  if (biasScore < -0.1) {
    // Left bias
    const leftStrength = Math.abs(biasScore); // 0.1 to 1.0
    const left = Math.round(30 + (leftStrength * 40)); // 30-70%
    const right = Math.round(10 + ((1 - leftStrength) * 20)); // 10-30%
    const center = 100 - left - right;
    return { left, center, right };
  } else if (biasScore > 0.1) {
    // Right bias
    const rightStrength = biasScore; // 0.1 to 1.0
    const right = Math.round(30 + (rightStrength * 40)); // 30-70%
    const left = Math.round(10 + ((1 - rightStrength) * 20)); // 10-30%
    const center = 100 - left - right;
    return { left, center, right };
  } else {
    // Center/neutral
    return { left: 30, center: 40, right: 30 };
  }
};

// Get human readable label from bias score
export const getBiasLabel = (biasScore: number): string => {
  // Find closest defined label
  const scores = Object.keys(BIAS_LABELS).map(Number).sort((a, b) => a - b);
  let closestScore = scores[0];
  let minDiff = Math.abs(biasScore - closestScore);

  for (const score of scores) {
    const diff = Math.abs(biasScore - score);
    if (diff < minDiff) {
      minDiff = diff;
      closestScore = score;
    }
  }

  return BIAS_LABELS[closestScore.toString() as keyof typeof BIAS_LABELS];
};

// Determine detected bias from score
export const getDetectedBias = (biasScore: number): 'left' | 'center' | 'right' => {
  if (biasScore < -0.1) return 'left';
  if (biasScore > 0.1) return 'right';
  return 'center';
};