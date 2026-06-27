import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../data/types.js';
import type { AmapClient } from '../services/amapClient.js';
import { requireUser } from './auth.js';

type AmapRouteDeps = {
  store: DataStore;
  sessionSecret: string;
  amapClient?: AmapClient;
};

export async function registerAmapRoutes(app: FastifyInstance, deps: AmapRouteDeps) {
  app.get('/api/amap/regeo', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    if (!deps.amapClient) return reply.status(503).send({ message: 'AMap client unavailable' });

    const query = request.query as {
      latitude?: string;
      longitude?: string;
    };
    const latitude = Number(query.latitude);
    const longitude = Number(query.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return reply.status(400).send({ message: 'Invalid AMap reverse geocode query' });
    }

    try {
      return deps.amapClient.reverseGeocode({
        location: { latitude, longitude }
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(502).send({ message: '高德地址解析暂时不可用，稍后再试' });
    }
  });

  app.get('/api/amap/search', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    if (!deps.amapClient) return reply.status(503).send({ message: 'AMap client unavailable' });

    const query = request.query as {
      keyword?: string;
      latitude?: string;
      longitude?: string;
      radiusMeters?: string;
    };
    const latitude = Number(query.latitude);
    const longitude = Number(query.longitude);
    const radiusMeters = Number(query.radiusMeters || '1500');
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radiusMeters)) {
      return reply.status(400).send({ message: 'Invalid AMap search query' });
    }

    try {
      const candidates = await deps.amapClient.searchRestaurants({
        location: { latitude, longitude },
        radiusMeters,
        keywords: query.keyword ? [query.keyword] : ['餐饮']
      });
      return {
        pois: candidates.map((candidate) => ({
          amapPoiId: candidate.poiId,
          name: candidate.name,
          category: candidate.category,
          address: candidate.address,
          latitude: candidate.location?.latitude ?? latitude,
          longitude: candidate.location?.longitude ?? longitude,
          avgPrice: candidate.avgPrice,
          rating: candidate.rating,
          distanceMeters: candidate.distanceMeters,
          tags: candidate.tags
        }))
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(502).send({ message: '高德搜索暂时不可用，稍后再试' });
    }
  });

  app.get('/api/amap/place-suggestions', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    if (!deps.amapClient?.searchPlaces) return reply.status(503).send({ message: 'AMap client unavailable' });

    const query = request.query as {
      keyword?: string;
      latitude?: string;
      longitude?: string;
      radiusMeters?: string;
    };
    const keyword = (query.keyword || '').trim();
    const latitude = Number(query.latitude);
    const longitude = Number(query.longitude);
    const radiusMeters = Number(query.radiusMeters || '5000');
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radiusMeters)) {
      return reply.status(400).send({ message: 'Invalid AMap place suggestion query' });
    }
    if (!keyword) return { pois: [] };

    try {
      const candidates = await deps.amapClient.searchPlaces({
        location: { latitude, longitude },
        radiusMeters,
        keyword
      });
      return {
        pois: candidates.map((candidate) => ({
          amapPoiId: candidate.poiId,
          name: candidate.name,
          category: candidate.category,
          address: candidate.address,
          latitude: candidate.location?.latitude ?? latitude,
          longitude: candidate.location?.longitude ?? longitude,
          distanceMeters: candidate.distanceMeters,
          tags: candidate.tags
        }))
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(502).send({ message: '地点候选暂时不可用，稍后再试' });
    }
  });
}
