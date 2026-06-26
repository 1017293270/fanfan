import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createAiClient } from './services/aiClient.js';
import { createAmapClient } from './services/amapClient.js';
import { createRecommendationService } from './services/recommendationService.js';

const config = loadConfig();
const aiCompleteJson = createAiClient(config);
const amapClient = createAmapClient(config);
const recommendationService = createRecommendationService({
  amapClient,
  aiCompleteJson
});

const app = buildApp({ recommendationService });

await app.listen({
  port: config.apiPort,
  host: '0.0.0.0'
});
