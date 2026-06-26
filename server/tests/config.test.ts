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
      NODE_ENV: 'test',
      SESSION_SECRET: 'session-secret',
      DATA_FILE_PATH: '.data/test.json',
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'admin-pass',
      ADMIN_DISPLAY_NAME: '管理员',
      INITIAL_INVITE_CODE: 'FAN-TEST'
    });

    expect(config).toEqual({
      apiPort: 8787,
      amapApiKey: 'amap-key',
      aiApiKey: 'ai-key',
      aiBaseUrl: 'https://ai.example.com/v1',
      aiModel: 'model-a',
      nodeEnv: 'test',
      sessionSecret: 'session-secret',
      dataFilePath: '.data/test.json',
      adminUsername: 'admin',
      adminPassword: 'admin-pass',
      adminDisplayName: '管理员',
      initialInviteCode: 'FAN-TEST'
    });
  });

  it('uses safe local defaults for optional account settings', () => {
    const config = loadConfig({
      API_PORT: '8787',
      AMAP_API_KEY: 'amap-key',
      OPENAI_COMPATIBLE_API_KEY: 'ai-key',
      OPENAI_COMPATIBLE_BASE_URL: 'https://ai.example.com/v1',
      OPENAI_COMPATIBLE_MODEL: 'model-a',
      NODE_ENV: 'test'
    });

    expect(config.sessionSecret).toBe('kaifanli-local-session-secret');
    expect(config.dataFilePath).toBe('.data/kaifanli-dev.json');
    expect(config.adminUsername).toBeUndefined();
    expect(config.initialInviteCode).toBeUndefined();
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
