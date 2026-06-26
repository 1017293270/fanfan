import type { ParsedPreference, RestaurantCandidate } from '../schemas/recommendation.js';
import type { AiCompleteJson } from './aiClient.js';

type ReasonPayload = {
  reason: string;
};

const FALLBACK_REASON = '这家距离和口味都比较符合你刚才的选择。';
const MAX_REASON_LENGTH = 35;

function shortReason(value: unknown): string {
  if (typeof value !== 'string') return FALLBACK_REASON;
  const trimmed = value.trim();
  if (!trimmed) return FALLBACK_REASON;
  return Array.from(trimmed).slice(0, MAX_REASON_LENGTH).join('');
}

export async function writeRecommendationReason(input: {
  aiCompleteJson: AiCompleteJson;
  preference: ParsedPreference;
  restaurant: RestaurantCandidate;
}): Promise<string> {
  try {
    const result = await input.aiCompleteJson<ReasonPayload>([
      {
        role: 'system',
        content: '你是开饭狸的饭饭狸。只输出 JSON，不要 Markdown。字段 reason 是 35 字以内中文推荐理由，亲切、具体、不夸张。'
      },
      {
        role: 'user',
        content: JSON.stringify({
          preference: input.preference,
          restaurant: input.restaurant
        })
      }
    ]);

    return shortReason(result.reason);
  } catch {
    return FALLBACK_REASON;
  }
}
