export type RuntimeConfig = {
  apiPort: number;
  amapApiKey: string;
  aiApiKey: string;
  aiBaseUrl: string;
  aiModel: string;
  nodeEnv: string;
};

type Env = Record<string, string | undefined>;

function required(env: Env, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function loadConfig(env: Env = process.env): RuntimeConfig {
  const portValue = required(env, 'API_PORT');
  const apiPort = Number.parseInt(portValue, 10);
  if (!Number.isInteger(apiPort) || apiPort <= 0) {
    throw new Error('API_PORT must be a positive integer');
  }

  return {
    apiPort,
    amapApiKey: required(env, 'AMAP_API_KEY'),
    aiApiKey: required(env, 'OPENAI_COMPATIBLE_API_KEY'),
    aiBaseUrl: required(env, 'OPENAI_COMPATIBLE_BASE_URL').replace(/\/$/, ''),
    aiModel: required(env, 'OPENAI_COMPATIBLE_MODEL'),
    nodeEnv: env.NODE_ENV?.trim() || 'development'
  };
}
