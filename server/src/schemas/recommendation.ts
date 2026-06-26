import { z } from 'zod';

export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export const QuickFiltersSchema = z.object({
  distanceMeters: z.number().int().min(300).max(10000),
  budgetPerPerson: z.number().int().min(10).max(500).optional(),
  spicyPreference: z.enum(['none', 'mild', 'medium', 'spicy']).optional(),
  craving: z.string().max(40).optional(),
  openNow: z.boolean().default(true)
});

export const LocalContextSchema = z.object({
  excludedPoiIds: z.array(z.string()).default([]),
  favoritePoiIds: z.array(z.string()).default([])
});

export const RecommendationRequestSchema = z.object({
  location: LocationSchema,
  textPreference: z.string().max(160).default(''),
  quickFilters: QuickFiltersSchema,
  localContext: LocalContextSchema.default({
    excludedPoiIds: [],
    favoritePoiIds: []
  })
});

export type RecommendationRequest = z.infer<typeof RecommendationRequestSchema>;

export type ParsedPreference = {
  distanceMeters: number;
  budgetPerPerson?: number;
  spicyPreference?: 'none' | 'mild' | 'medium' | 'spicy';
  cravings: string[];
  avoid: string[];
  mealScene?: string;
  mustOpenNow: boolean;
};

export type RestaurantCandidate = {
  poiId: string;
  name: string;
  category: string;
  distanceMeters: number;
  rating?: string;
  avgPrice?: number;
  address: string;
  tags: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  openNow?: boolean;
};

export type RecommendedRestaurant = RestaurantCandidate & {
  reason?: string;
};

export type RecommendationResponse = {
  requestId: string;
  parsedPreference: ParsedPreference;
  primaryRecommendation: RecommendedRestaurant;
  alternatives: RestaurantCandidate[];
};
