import type { ParsedPreference, RestaurantCandidate } from '../schemas/recommendation.js';
import type { AiCompleteJson } from './aiClient.js';

type ReasonPayload = {
  reason: string;
};

export async function writeRecommendationReason(input: {
  aiCompleteJson: AiCompleteJson;
  preference: ParsedPreference;
  restaurant: RestaurantCandidate;
}): Promise<string> {
  try {
    const result = await input.aiCompleteJson<ReasonPayload>([
      {
        role: 'system',
        content: '你是开饭狸的饭饭狸。只输出 JSON，字段 reason 是 35 字以内中文推荐理由，亲切、具体、不夸张。'
      },
      {
        role: 'user',
        content: JSON.stringify({
          preference: input.preference,
          restaurant: input.restaurant
        })
      }
    ]);

    return result.reason || '这家距离和口味都比较符合你刚才的选择。';
  } catch {
    return '这家距离和口味都比较符合你刚才的选择。';
  }
}
