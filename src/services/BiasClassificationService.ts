import { HF_API_TOKEN, isValidToken, HF_ZERO_SHOT_URL } from '../config/aiConfig';

export interface BiasResult {
  left: number;   // 0-100
  center: number; // 0-100
  right: number;  // 0-100
  detectedBias: 'left' | 'center' | 'right';
  confidence: number; // 0-1 (max score)
}

class BiasClassificationService {
  private normalizeScores(labels: string[], scores: number[]): BiasResult {
    const map = new Map<string, number>();
    labels.forEach((l, i) => map.set(l.toLowerCase(), scores[i]));

    // Ensure we have values for all classes
    const left = map.get('left') ?? 0;
    const center = map.get('center') ?? 0;
    const right = map.get('right') ?? 0;
    const sum = left + center + right || 1;

    const norm = {
      left: Math.round((left / sum) * 100),
      center: Math.round((center / sum) * 100),
      right: Math.round((right / sum) * 100),
    };

    // Determine detected class and confidence
    const arr: Array<['left' | 'center' | 'right', number]> = [
      ['left', left],
      ['center', center],
      ['right', right],
    ];
    arr.sort((a, b) => b[1] - a[1]);
    const detectedBias = arr[0][0];
    const confidence = arr[0][1];

    return { ...norm, detectedBias, confidence };
  }

  async classify(text: string): Promise<BiasResult> {
    if (!isValidToken()) {
      throw new Error('Missing Hugging Face token for bias classification');
    }

    const input = (text || '').trim();
    if (!input) {
      throw new Error('Empty text provided for bias classification');
    }

    const truncated = input.length > 3000 ? input.slice(0, 3000) : input;

    const body = {
      inputs: truncated,
      parameters: {
        candidate_labels: ['left', 'center', 'right'],
        multi_label: false,
      },
    };

    const callApi = async (): Promise<Response> => {
      return fetch(HF_ZERO_SHOT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    };

    let res = await callApi();
    if (!res.ok && (res.status === 503 || res.status === 524)) {
      await new Promise((r) => setTimeout(r, 2000));
      res = await callApi();
    }

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 401) throw new Error('HF auth failed for bias classification');
      if (res.status === 429) throw new Error('HF rate limit for bias classification');
      throw new Error(`HF error (${res.status}): ${txt}`);
    }

    const data = await res.json();
    if (data?.error) {
      const msg = String(data.error).toLowerCase();
      if (msg.includes('loading')) {
        await new Promise((r) => setTimeout(r, 1500));
        const retry = await callApi();
        if (!retry.ok) throw new Error('HF model still loading');
        const retryData = await retry.json();
        return this.normalizeScores(retryData.labels, retryData.scores);
      }
      throw new Error(data.error);
    }

    if (!data?.labels || !data?.scores) {
      throw new Error('Invalid response format from HF zero-shot');
    }

    return this.normalizeScores(data.labels, data.scores);
  }
}

export const biasClassificationService = new BiasClassificationService();
