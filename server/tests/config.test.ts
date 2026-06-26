import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('loads required runtime configuration from environment values', () => {
    const config = loadConfig({
      API_PORT: '8787',
      AMAP_API_KEY: 'amap-key',
      OPENAI_COMPATIBLE_API_KEY: 'ai-key',
      OPENAI_COMPATIBLE_BASE_URL: 'https://ai.example.com/v1',
      OPENAI_COMPATIBLE_MODEL: 'model-a',
      NODE_ENV: 'test'
    });

    expect(config).toEqual({
      apiPort: 8787,
      amapApiKey: 'amap-key',
      aiApiKey: 'ai-key',
      aiBaseUrl: 'https://ai.example.com/v1',
      aiModel: 'model-a',
      nodeEnv: 'test'
    });
  });

  it('throws a helpful error when a required key is missing', () => {
    expect(() =>
      loadConfig({
        API_PORT: '8787',
        AMAP_API_KEY: '',
        OPENAI_COMPATIBLE_API_KEY: 'ai-key',
        OPENAI_COMPATIBLE_BASE_URL: 'https://ai.example.com/v1',
        OPENAI_COMPATIBLE_MODEL: 'model-a',
        NODE_ENV: 'test'
      })
    ).toThrow('Missing required environment variable: AMAP_API_KEY');
  });
});
