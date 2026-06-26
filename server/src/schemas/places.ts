import { z } from 'zod';
import { LocationSchema } from './recommendation.js';

export const PlaceCreateSchema = z.object({
  name: z.string().trim().min(1).max(40),
  address: z.string().trim().min(1).max(160),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(100).max(5000).default(500),
  sortOrder: z.number().int().min(0).optional()
});

export const PlaceUpdateSchema = PlaceCreateSchema.partial();
export const PlaceMatchSchema = LocationSchema;
