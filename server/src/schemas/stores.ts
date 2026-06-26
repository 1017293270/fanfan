import { z } from 'zod';

export const StorePlaceStatusSchema = z.enum(['active', 'favorite', 'blocked', 'tired']);

export const StoreCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(180),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  avgPrice: z.number().int().min(0).max(2000).optional(),
  rating: z.string().max(20).optional(),
  phone: z.string().max(40).optional(),
  placeIds: z.array(z.string()).min(1),
  tags: z.array(z.string().trim().min(1).max(24)).default([]),
  status: StorePlaceStatusSchema.default('active'),
  note: z.string().max(300).optional()
});

export const StoreUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  address: z.string().trim().min(1).max(180).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  avgPrice: z.number().int().min(0).max(2000).optional(),
  rating: z.string().max(20).optional(),
  phone: z.string().max(40).optional()
});

export const LinkUpdateSchema = z.object({
  status: StorePlaceStatusSchema.optional(),
  tags: z.array(z.string().trim().min(1).max(24)).optional(),
  note: z.string().max(300).optional(),
  lastEatenAt: z.string().datetime().optional(),
  eatenCount: z.number().int().min(0).optional()
});

export const AmapImportSchema = z.object({
  placeId: z.string().min(1),
  poi: z.object({
    amapPoiId: z.string().min(1),
    name: z.string().trim().min(1).max(80),
    category: z.string().trim().min(1).max(80),
    address: z.string().trim().min(1).max(180),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    avgPrice: z.number().int().min(0).max(2000).optional(),
    rating: z.string().max(20).optional(),
    phone: z.string().max(40).optional()
  }),
  tags: z.array(z.string().trim().min(1).max(24)).default([]),
  status: StorePlaceStatusSchema.default('active')
});
