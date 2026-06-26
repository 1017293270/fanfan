export type RuntimeConfig = {
  apiPort: number;
  amapApiKey: string;
  aiApiKey: string;
  aiBaseUrl: string;
  aiModel: string;
  nodeEnv: string;
  sessionSecret: string;
  dataFilePath: string;
  adminUsername?: string;
  adminPassword?: string;
  adminDisplayName?: string;
  initialInviteCode?: string;
};

type Env = Record<string, string | undefined>;

function required(env: Env, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(env: Env, key: string): string | undefined {
  const value = env[key]?.trim();
  return value || undefined;
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
    nodeEnv: env.NODE_ENV?.trim() || 'development',
    sessionSecret: optional(env, 'SESSION_SECRET') || 'kaifanli-local-session-secret',
    dataFilePath: optional(env, 'DATA_FILE_PATH') || '.data/kaifanli-dev.json',
    adminUsername: optional(env, 'ADMIN_USERNAME'),
    adminPassword: optional(env, 'ADMIN_PASSWORD'),
    adminDisplayName: optional(env, 'ADMIN_DISPLAY_NAME'),
    initialInviteCode: optional(env, 'INITIAL_INVITE_CODE')
  };
}
