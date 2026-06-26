import type { ParsedPreference, RecommendationRequest } from '../schemas/recommendation.js';
import type { AiCompleteJson } from './aiClient.js';

type ParsePreferenceInput = Pick<RecommendationRequest, 'textPreference' | 'quickFilters'> & {
  aiCompleteJson: AiCompleteJson;
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function fallbackParse(input: Pick<RecommendationRequest, 'textPreference' | 'quickFilters'>): ParsedPreference {
  const text = input.textPreference;
  const cravings = [input.quickFilters.craving || ''];
  const avoid: string[] = [];

  if (text.includes('热乎') || text.includes('热的') || text.includes('热汤')) cravings.push('热乎');
  if (text.includes('米饭') || text.includes('盖饭')) cravings.push('米饭');
  if (text.includes('面') || text.includes('面条')) cravings.push('面食');
  if (text.includes('不辣') || text.includes('不要太辣') || text.includes('少辣')) avoid.push('太辣');
  if (text.includes('别太远') || text.includes('近一点')) avoid.push('太远');

  return {
    distanceMeters: input.quickFilters.distanceMeters,
    budgetPerPerson: input.quickFilters.budgetPerPerson,
    spicyPreference: input.quickFilters.spicyPreference,
    cravings: unique(cravings),
    avoid: unique(avoid),
    mealScene: undefined,
    mustOpenNow: input.quickFilters.openNow
  };
}

export async function parsePreference(input: ParsePreferenceInput): Promise<ParsedPreference> {
  try {
    const parsed = await input.aiCompleteJson<ParsedPreference>([
      {
        role: 'system',
        content:
          '你是开饭狸的偏好解析器。只输出 JSON。字段必须包含 distanceMeters, cravings, avoid, mustOpenNow，可选 budgetPerPerson, spicyPreference, mealScene。'
      },
      {
        role: 'user',
        content: JSON.stringify({
          textPreference: input.textPreference,
          quickFilters: input.quickFilters
        })
      }
    ]);

    return {
      distanceMeters: parsed.distanceMeters || input.quickFilters.distanceMeters,
      budgetPerPerson: parsed.budgetPerPerson ?? input.quickFilters.budgetPerPerson,
      spicyPreference: parsed.spicyPreference ?? input.quickFilters.spicyPreference,
      cravings: unique(parsed.cravings || []),
      avoid: unique(parsed.avoid || []),
      mealScene: parsed.mealScene,
      mustOpenNow: parsed.mustOpenNow ?? input.quickFilters.openNow
    };
  } catch {
    return fallbackParse(input);
  }
}
