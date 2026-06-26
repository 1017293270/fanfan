import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createFileStore } from './data/fileStore.js';
import { seedInitialData } from './data/seed.js';
import { createAiClient } from './services/aiClient.js';
import { createAmapClient } from './services/amapClient.js';
import { createRecommendationService } from './services/recommendationService.js';

const config = loadConfig();
const store = await createFileStore(config.dataFilePath);
await seedInitialData(store, config);
const aiCompleteJson = createAiClient(config);
const amapClient = createAmapClient(config);
const recommendationService = createRecommendationService({
  amapClient,
  aiCompleteJson,
  dataStore: store
});

const app = buildApp({
  recommendationService,
  store,
  sessionSecret: config.sessionSecret,
  amapClient
});

await app.listen({
  port: config.apiPort,
  host: '0.0.0.0'
});
