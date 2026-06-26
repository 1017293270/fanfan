import type { ParsedPreference, RecommendationRequest } from '../schemas/recommendation.js';
import type { AiCompleteJson } from './aiClient.js';

type ParsePreferenceInput = Pick<RecommendationRequest, 'textPreference' | 'quickFilters'> & {
  aiCompleteJson: AiCompleteJson;
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function textValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

function mealSceneValue(value: unknown): string | undefined {
  return textValues(value).join('、') || undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function spicyValue(value: unknown): ParsedPreference['spicyPreference'] | undefined {
  return value === 'none' || value === 'mild' || value === 'medium' || value === 'spicy' ? value : undefined;
}

function cravingValues(parsedCravings: unknown, quickCraving?: string): string[] {
  const cravings = textValues(parsedCravings);
  return cravings.length > 0 ? unique(cravings) : unique([quickCraving || '']);
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
    const parsed = (await input.aiCompleteJson<ParsedPreference>([
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
    ])) as Record<string, unknown>;

    return {
      distanceMeters: numberValue(parsed.distanceMeters) || input.quickFilters.distanceMeters,
      budgetPerPerson: numberValue(parsed.budgetPerPerson) ?? input.quickFilters.budgetPerPerson,
      spicyPreference: spicyValue(parsed.spicyPreference) ?? input.quickFilters.spicyPreference,
      cravings: cravingValues(parsed.cravings, input.quickFilters.craving),
      avoid: unique(textValues(parsed.avoid)),
      mealScene: mealSceneValue(parsed.mealScene),
      mustOpenNow: booleanValue(parsed.mustOpenNow) ?? input.quickFilters.openNow
    };
  } catch {
    return fallbackParse(input);
  }
}
