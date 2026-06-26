import type { ParsedPreference, RestaurantCandidate } from '../schemas/recommendation.js';

export type RankCandidatesInput = {
  candidates: RestaurantCandidate[];
  preference: ParsedPreference;
  excludedPoiIds: string[];
  favoritePoiIds: string[];
};

function includesAny(source: string[], targets: string[]): boolean {
  const normalized = source.join(' ').toLowerCase();
  return targets.some((target) => normalized.includes(target.toLowerCase()));
}

const lightMealKeywords = ['咖啡', '奶茶', '饮品', '茶饮', '甜品', '蛋糕', '面包'];
const mealKeywords = [
  '中餐',
  '快餐',
  '小吃',
  '面馆',
  '面食',
  '米饭',
  '盖饭',
  '家常菜',
  '火锅',
  '烧烤',
  '炒菜',
  '粥',
  '粉',
  '饺子',
  '馄饨',
  '川菜',
  '湘菜',
  '粤菜',
  '西餐',
  '日料',
  '韩餐'
];

function hasAnyKeyword(source: string[], keywords: string[]): boolean {
  const normalized = source.join(' ').toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function wantsLightMeal(preference: ParsedPreference): boolean {
  return hasAnyKeyword(preference.cravings, lightMealKeywords);
}

function defaultMealFitScore(candidate: RestaurantCandidate, preference: ParsedPreference): number {
  if (wantsLightMeal(preference)) return 0;

  const searchText = candidate.tags.concat(candidate.name, candidate.category);
  const isMeal = hasAnyKeyword(searchText, mealKeywords);
  const isLightMeal = hasAnyKeyword(searchText, lightMealKeywords);

  if (isMeal) return 18;
  if (isLightMeal) return -35;
  return 0;
}

function scoreCandidate(
  candidate: RestaurantCandidate,
  preference: ParsedPreference,
  favoritePoiIds: string[]
): number {
  let score = 0;

  if (candidate.distanceMeters <= preference.distanceMeters) {
    score += 30;
  } else {
    score -= Math.min(30, Math.floor((candidate.distanceMeters - preference.distanceMeters) / 100));
  }

  if (preference.budgetPerPerson && candidate.avgPrice) {
    score += candidate.avgPrice <= preference.budgetPerPerson + 10 ? 20 : -15;
  }

  const searchText = candidate.tags.concat(candidate.name, candidate.category);
  if (includesAny(searchText, preference.cravings)) score += 25;
  if (includesAny(searchText, preference.avoid)) score -= 30;
  score += defaultMealFitScore(candidate, preference);
  if (candidate.openNow === true) score += 10;
  if (favoritePoiIds.includes(candidate.poiId)) score += 5;

  const rating = Number(candidate.rating);
  if (Number.isFinite(rating)) score += Math.round(rating * 3);

  return score;
}

export function rankCandidates(input: RankCandidatesInput): RestaurantCandidate[] {
  const excluded = new Set(input.excludedPoiIds);
  return input.candidates
    .filter((candidate) => !excluded.has(candidate.poiId))
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, input.preference, input.favoritePoiIds)
    }))
    .sort((a, b) => b.score - a.score || a.candidate.distanceMeters - b.candidate.distanceMeters)
    .map((item) => item.candidate);
}
