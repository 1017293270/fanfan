# Kaifanli MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working `开饭狸` WeChat mini program MVP with a native mini program frontend, independent Node.js backend, real AMap POI integration, OpenAI-compatible AI preference parsing/reason writing, and local-only favorites/exclusions.

**Architecture:** The repo is a two-surface app: `miniprogram/` contains the WeChat native UI and local storage, while `server/` exposes a single recommendation API that protects secrets and coordinates AI, AMap, ranking, and response shaping. The MVP is a vertical slice: location + preferences in, one main recommendation and two alternates out.

**Tech Stack:** WeChat native mini program (`WXML/WXSS/JS`), Node.js `25.8.1`, Fastify, TypeScript, Zod, Vitest, native `fetch`, AMap Web Service API, OpenAI-compatible chat completions API.

---

## Scope Check

The product has two code surfaces, but the MVP is one tightly coupled vertical slice. This plan keeps frontend and backend in one implementation plan because neither side is independently useful without the `/api/recommendations` contract. Future work such as login, multiplayer voting, route-time calculation, or cloud profile sync should get separate specs and plans.

## File Structure

Create this repo layout:

```text
E:\fanzainai
  .gitignore
  package.json
  README.md
  assets/
    brand/
      kaifanli-avatar-144.png
      kaifanli-avatar-source.png
  docs/
    superpowers/
      specs/
        2026-06-26-kaifanli-mini-program-design.md
      plans/
        2026-06-26-kaifanli-mvp.md
  server/
    .env.example
    package.json
    tsconfig.json
    vitest.config.ts
    src/
      app.ts
      server.ts
      config.ts
      schemas/
        recommendation.ts
      routes/
        recommendations.ts
      services/
        aiClient.ts
        amapClient.ts
        preferenceParser.ts
        ranker.ts
        reasonWriter.ts
        recommendationService.ts
      test/
        fixtures.ts
    tests/
      config.test.ts
      preferenceParser.test.ts
      ranker.test.ts
      recommendationService.test.ts
      recommendations.route.test.ts
  miniprogram/
    project.config.json
    app.json
    app.js
    app.wxss
    assets/
      brand/
        kaifanli-avatar-144.png
    components/
      mascot-state/
        mascot-state.json
        mascot-state.wxml
        mascot-state.wxss
        mascot-state.js
      preference-chip/
        preference-chip.json
        preference-chip.wxml
        preference-chip.wxss
        preference-chip.js
      recommendation-card/
        recommendation-card.json
        recommendation-card.wxml
        recommendation-card.wxss
        recommendation-card.js
      restaurant-row/
        restaurant-row.json
        restaurant-row.wxml
        restaurant-row.wxss
        restaurant-row.js
    pages/
      index/
        index.json
        index.wxml
        index.wxss
        index.js
    utils/
      api.js
      storage.js
      viewModel.js
```

## Task 1: Initialize Repository And Tooling

**Files:**
- Create: `E:\fanzainai\.gitignore`
- Create: `E:\fanzainai\package.json`
- Create: `E:\fanzainai\README.md`
- Create: `E:\fanzainai\server\package.json`
- Create: `E:\fanzainai\server\tsconfig.json`
- Create: `E:\fanzainai\server\vitest.config.ts`
- Create: `E:\fanzainai\server\.env.example`

- [ ] **Step 1: Initialize git**

Run:

```powershell
git init
```

Expected: `Initialized empty Git repository`.

- [ ] **Step 2: Create root ignore rules**

Create `E:\fanzainai\.gitignore`:

```gitignore
node_modules/
dist/
.env
.env.*
!.env.example
miniprogram/project.private.config.json
.DS_Store
Thumbs.db
.superpowers/
```

- [ ] **Step 3: Create root package metadata**

Create `E:\fanzainai\package.json`:

```json
{
  "name": "kaifanli",
  "private": true,
  "version": "0.1.0",
  "description": "开饭狸微信小程序 MVP",
  "workspaces": [
    "server"
  ],
  "scripts": {
    "dev:server": "npm --workspace server run dev",
    "build:server": "npm --workspace server run build",
    "test": "npm --workspace server test",
    "test:server": "npm --workspace server test"
  }
}
```

- [ ] **Step 4: Create backend package metadata**

Create `E:\fanzainai\server\package.json`:

```json
{
  "name": "@kaifanli/server",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@fastify/cors": "^11.0.0",
    "fastify": "^5.4.0",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "@types/node": "^24.0.4",
    "tsx": "^4.20.3",
    "typescript": "^5.8.3",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 5: Create backend TypeScript config**

Create `E:\fanzainai\server\tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 6: Create Vitest config**

Create `E:\fanzainai\server\vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts']
  }
});
```

- [ ] **Step 7: Create environment example**

Create `E:\fanzainai\server\.env.example`:

```env
API_PORT=8787
AMAP_API_KEY=
OPENAI_COMPATIBLE_API_KEY=
OPENAI_COMPATIBLE_BASE_URL=https://api.openai.com/v1
OPENAI_COMPATIBLE_MODEL=gpt-4.1-mini
NODE_ENV=development
```

- [ ] **Step 8: Create project README**

Create `E:\fanzainai\README.md`:

```md
# 开饭狸

开饭狸是一个微信小程序 MVP，用当前位置、口味偏好和附近餐厅数据，帮用户快速决定今天吃什么。

## 本地开发

1. 安装依赖：`npm install`
2. 复制后端配置：`Copy-Item server/.env.example server/.env`
3. 在 `server/.env` 中填写高德 Key 和 OpenAI-compatible Key
4. 启动后端：`npm run dev:server`
5. 用微信开发者工具打开 `miniprogram/`

真实微信 AppID 通过微信开发者工具或 `miniprogram/project.private.config.json` 本地配置，不提交到仓库。
```

- [ ] **Step 9: Install dependencies**

Run:

```powershell
npm install
```

Expected: root `package-lock.json` created and server dependencies installed.

- [ ] **Step 10: Run initial test command**

Run:

```powershell
npm test
```

Expected: Vitest reports no tests found or exits after the test harness is ready. If Vitest exits with a non-zero no-test status, continue because Task 2 adds the first test.

- [ ] **Step 11: Commit tooling**

Run:

```powershell
git add .gitignore package.json package-lock.json README.md server
git commit -m "chore: initialize kaifanli workspace"
```

Expected: commit succeeds.

## Task 2: Backend Config And API Schemas

**Files:**
- Create: `E:\fanzainai\server\src\config.ts`
- Create: `E:\fanzainai\server\src\schemas\recommendation.ts`
- Create: `E:\fanzainai\server\tests\config.test.ts`

- [ ] **Step 1: Write config tests**

Create `E:\fanzainai\server\tests\config.test.ts`:

```ts
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
```

- [ ] **Step 2: Run config tests and verify failure**

Run:

```powershell
npm --workspace server test -- tests/config.test.ts
```

Expected: FAIL because `src/config.ts` does not exist.

- [ ] **Step 3: Implement config loading**

Create `E:\fanzainai\server\src\config.ts`:

```ts
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
```

- [ ] **Step 4: Implement recommendation schemas**

Create `E:\fanzainai\server\src\schemas\recommendation.ts`:

```ts
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
```

- [ ] **Step 5: Run config tests and build**

Run:

```powershell
npm --workspace server test -- tests/config.test.ts
npm run build:server
```

Expected: tests PASS and TypeScript build succeeds.

- [ ] **Step 6: Commit config and schema**

Run:

```powershell
git add server/src/config.ts server/src/schemas/recommendation.ts server/tests/config.test.ts
git commit -m "feat: add backend config and recommendation schema"
```

Expected: commit succeeds.

## Task 3: Preference Parser With AI Adapter And Rule Fallback

**Files:**
- Create: `E:\fanzainai\server\src\services\aiClient.ts`
- Create: `E:\fanzainai\server\src\services\preferenceParser.ts`
- Create: `E:\fanzainai\server\tests\preferenceParser.test.ts`

- [ ] **Step 1: Write preference parser tests**

Create `E:\fanzainai\server\tests\preferenceParser.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parsePreference } from '../src/services/preferenceParser.js';

describe('parsePreference', () => {
  it('uses AI structured output when available', async () => {
    const result = await parsePreference({
      textPreference: '想吃热乎的，不太辣，别太远',
      quickFilters: {
        distanceMeters: 1500,
        budgetPerPerson: 30,
        spicyPreference: 'mild',
        craving: '米饭',
        openNow: true
      },
      aiCompleteJson: async () => ({
        distanceMeters: 1200,
        budgetPerPerson: 35,
        spicyPreference: 'mild',
        cravings: ['热乎', '米饭'],
        avoid: ['太辣', '太远'],
        mealScene: '工作日午餐',
        mustOpenNow: true
      })
    });

    expect(result.cravings).toEqual(['热乎', '米饭']);
    expect(result.distanceMeters).toBe(1200);
    expect(result.mustOpenNow).toBe(true);
  });

  it('falls back to quick filters and keywords when AI fails', async () => {
    const result = await parsePreference({
      textPreference: '今天不要太辣，想吃热乎的',
      quickFilters: {
        distanceMeters: 1500,
        budgetPerPerson: 30,
        spicyPreference: 'mild',
        craving: '米饭',
        openNow: true
      },
      aiCompleteJson: async () => {
        throw new Error('ai unavailable');
      }
    });

    expect(result).toEqual({
      distanceMeters: 1500,
      budgetPerPerson: 30,
      spicyPreference: 'mild',
      cravings: ['米饭', '热乎'],
      avoid: ['太辣'],
      mealScene: undefined,
      mustOpenNow: true
    });
  });
});
```

- [ ] **Step 2: Run parser tests and verify failure**

Run:

```powershell
npm --workspace server test -- tests/preferenceParser.test.ts
```

Expected: FAIL because parser files do not exist.

- [ ] **Step 3: Implement AI JSON client**

Create `E:\fanzainai\server\src\services\aiClient.ts`:

```ts
import type { RuntimeConfig } from '../config.js';

export type AiCompleteJson = <T>(messages: Array<{ role: 'system' | 'user'; content: string }>) => Promise<T>;

export function createAiClient(config: RuntimeConfig): AiCompleteJson {
  return async function completeJson<T>(messages): Promise<T> {
    const response = await fetch(`${config.aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.aiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.aiModel,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages
      })
    });

    if (!response.ok) {
      throw new Error(`AI request failed with status ${response.status}`);
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('AI response did not include message content');
    }

    return JSON.parse(content) as T;
  };
}
```

- [ ] **Step 4: Implement preference parser**

Create `E:\fanzainai\server\src\services\preferenceParser.ts`:

```ts
import type { ParsedPreference, RecommendationRequest } from '../schemas/recommendation.js';
import type { AiCompleteJson } from './aiClient.js';

type ParsePreferenceInput = Pick<RecommendationRequest, 'textPreference' | 'quickFilters'> & {
  aiCompleteJson: AiCompleteJson;
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function fallbackParse(input: Pick<RecommendationRequest, 'textPreference' | 'quickFilters'>): ParsedPreference {
  const text = input.textPreference;
  const cravings = [input.quickFilters.craving || ''];
  const avoid: string[] = [];

  if (text.includes('热乎') || text.includes('热的') || text.includes('热汤')) cravings.push('热乎');
  if (text.includes('米饭') || text.includes('盖饭')) cravings.push('米饭');
  if (text.includes('面') || text.includes('面条')) cravings.push('面食');
  if (text.includes('不辣') || text.includes('不要太辣') || text.includes('少辣')) avoid.push('太辣');
  if (text.includes('别太远') || text.includes('近一点')) avoid.push('太远');

  return {
    distanceMeters: input.quickFilters.distanceMeters,
    budgetPerPerson: input.quickFilters.budgetPerPerson,
    spicyPreference: input.quickFilters.spicyPreference,
    cravings: unique(cravings),
    avoid: unique(avoid),
    mealScene: undefined,
    mustOpenNow: input.quickFilters.openNow
  };
}

export async function parsePreference(input: ParsePreferenceInput): Promise<ParsedPreference> {
  try {
    const parsed = await input.aiCompleteJson<ParsedPreference>([
      {
        role: 'system',
        content:
          '你是开饭狸的偏好解析器。只输出 JSON。字段必须包含 distanceMeters, cravings, avoid, mustOpenNow，可选 budgetPerPerson, spicyPreference, mealScene。'
      },
      {
        role: 'user',
        content: JSON.stringify({
          textPreference: input.textPreference,
          quickFilters: input.quickFilters
        })
      }
    ]);

    return {
      distanceMeters: parsed.distanceMeters || input.quickFilters.distanceMeters,
      budgetPerPerson: parsed.budgetPerPerson ?? input.quickFilters.budgetPerPerson,
      spicyPreference: parsed.spicyPreference ?? input.quickFilters.spicyPreference,
      cravings: unique(parsed.cravings || []),
      avoid: unique(parsed.avoid || []),
      mealScene: parsed.mealScene,
      mustOpenNow: parsed.mustOpenNow ?? input.quickFilters.openNow
    };
  } catch {
    return fallbackParse(input);
  }
}
```

- [ ] **Step 5: Run parser tests and build**

Run:

```powershell
npm --workspace server test -- tests/preferenceParser.test.ts
npm run build:server
```

Expected: tests PASS and TypeScript build succeeds.

- [ ] **Step 6: Commit parser**

Run:

```powershell
git add server/src/services/aiClient.ts server/src/services/preferenceParser.ts server/tests/preferenceParser.test.ts
git commit -m "feat: parse food preferences with ai fallback"
```

Expected: commit succeeds.

## Task 4: AMap Client

**Files:**
- Create: `E:\fanzainai\server\src\services\amapClient.ts`
- Create: `E:\fanzainai\server\src\test\fixtures.ts`

- [ ] **Step 1: Create shared fixtures**

Create `E:\fanzainai\server\src\test\fixtures.ts`:

```ts
import type { RestaurantCandidate } from '../schemas/recommendation.js';

export const candidateA: RestaurantCandidate = {
  poiId: 'B001',
  name: '巷口小厨',
  category: '中餐',
  distanceMeters: 680,
  rating: '4.6',
  avgPrice: 32,
  address: '示例路 88 号',
  tags: ['米饭', '家常菜', '少辣'],
  location: { latitude: 31.2304, longitude: 121.4737 },
  openNow: true
};

export const candidateB: RestaurantCandidate = {
  poiId: 'B002',
  name: '热汤面馆',
  category: '面馆',
  distanceMeters: 920,
  rating: '4.4',
  avgPrice: 28,
  address: '示例街 12 号',
  tags: ['热乎', '面食'],
  location: { latitude: 31.231, longitude: 121.474 },
  openNow: true
};
```

- [ ] **Step 2: Implement AMap client**

Create `E:\fanzainai\server\src\services\amapClient.ts`:

```ts
import type { RuntimeConfig } from '../config.js';
import type { RestaurantCandidate } from '../schemas/recommendation.js';

type Location = {
  latitude: number;
  longitude: number;
};

type AmapPoi = {
  id?: string;
  name?: string;
  type?: string;
  distance?: string;
  biz_ext?: {
    rating?: string;
    cost?: string;
  };
  address?: string;
  location?: string;
};

function parseLocation(location?: string): RestaurantCandidate['location'] {
  if (!location) return undefined;
  const [longitudeText, latitudeText] = location.split(',');
  const longitude = Number(longitudeText);
  const latitude = Number(latitudeText);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  return { latitude, longitude };
}

function parsePrice(cost?: string): number | undefined {
  if (!cost) return undefined;
  const value = Number.parseInt(cost, 10);
  return Number.isFinite(value) ? value : undefined;
}

function mapPoi(poi: AmapPoi): RestaurantCandidate | undefined {
  if (!poi.id || !poi.name) return undefined;
  return {
    poiId: poi.id,
    name: poi.name,
    category: poi.type || '餐饮',
    distanceMeters: Number.parseInt(poi.distance || '999999', 10),
    rating: poi.biz_ext?.rating,
    avgPrice: parsePrice(poi.biz_ext?.cost),
    address: Array.isArray(poi.address) ? poi.address.join('') : poi.address || '',
    tags: (poi.type || '餐饮').split(';').filter(Boolean),
    location: parseLocation(poi.location),
    openNow: undefined
  };
}

export type AmapClient = {
  searchRestaurants(input: {
    location: Location;
    radiusMeters: number;
    keywords: string[];
  }): Promise<RestaurantCandidate[]>;
};

export function createAmapClient(config: RuntimeConfig): AmapClient {
  return {
    async searchRestaurants(input) {
      const keywords = input.keywords.length ? input.keywords.join('|') : '餐饮';
      const url = new URL('https://restapi.amap.com/v3/place/around');
      url.searchParams.set('key', config.amapApiKey);
      url.searchParams.set('location', `${input.location.longitude},${input.location.latitude}`);
      url.searchParams.set('radius', String(input.radiusMeters));
      url.searchParams.set('keywords', keywords);
      url.searchParams.set('types', '050000');
      url.searchParams.set('extensions', 'all');
      url.searchParams.set('offset', '25');
      url.searchParams.set('page', '1');

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`AMap request failed with status ${response.status}`);
      }

      const body = (await response.json()) as { status?: string; info?: string; pois?: AmapPoi[] };
      if (body.status !== '1') {
        throw new Error(`AMap request failed: ${body.info || 'unknown error'}`);
      }

      return (body.pois || []).map(mapPoi).filter((item): item is RestaurantCandidate => Boolean(item));
    }
  };
}
```

- [ ] **Step 3: Build to catch type errors**

Run:

```powershell
npm run build:server
```

Expected: TypeScript build succeeds.

- [ ] **Step 4: Commit AMap client**

Run:

```powershell
git add server/src/services/amapClient.ts server/src/test/fixtures.ts
git commit -m "feat: add amap restaurant search client"
```

Expected: commit succeeds.

## Task 5: Ranking And Recommendation Service

**Files:**
- Create: `E:\fanzainai\server\src\services\ranker.ts`
- Create: `E:\fanzainai\server\src\services\reasonWriter.ts`
- Create: `E:\fanzainai\server\src\services\recommendationService.ts`
- Create: `E:\fanzainai\server\tests\ranker.test.ts`
- Create: `E:\fanzainai\server\tests\recommendationService.test.ts`

- [ ] **Step 1: Write ranker tests**

Create `E:\fanzainai\server\tests\ranker.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { rankCandidates } from '../src/services/ranker.js';
import { candidateA, candidateB } from '../src/test/fixtures.js';

describe('rankCandidates', () => {
  it('excludes disliked POIs and prefers matching cravings, budget, and distance', () => {
    const ranked = rankCandidates({
      candidates: [
        { ...candidateA, poiId: 'excluded', name: '排除店' },
        candidateB,
        { ...candidateA, poiId: 'B003', distanceMeters: 2400, avgPrice: 80, tags: ['火锅', '辣'] }
      ],
      preference: {
        distanceMeters: 1500,
        budgetPerPerson: 35,
        spicyPreference: 'mild',
        cravings: ['热乎', '面食'],
        avoid: ['太辣'],
        mustOpenNow: true
      },
      excludedPoiIds: ['excluded'],
      favoritePoiIds: []
    });

    expect(ranked[0].poiId).toBe('B002');
    expect(ranked.some((item) => item.poiId === 'excluded')).toBe(false);
  });
});
```

- [ ] **Step 2: Run ranker tests and verify failure**

Run:

```powershell
npm --workspace server test -- tests/ranker.test.ts
```

Expected: FAIL because `ranker.ts` does not exist.

- [ ] **Step 3: Implement ranker**

Create `E:\fanzainai\server\src\services\ranker.ts`:

```ts
import type { ParsedPreference, RestaurantCandidate } from '../schemas/recommendation.js';

export type RankCandidatesInput = {
  candidates: RestaurantCandidate[];
  preference: ParsedPreference;
  excludedPoiIds: string[];
  favoritePoiIds: string[];
};

function includesAny(source: string[], targets: string[]): boolean {
  const normalized = source.join(' ').toLowerCase();
  return targets.some((target) => normalized.includes(target.toLowerCase()));
}

function scoreCandidate(candidate: RestaurantCandidate, preference: ParsedPreference, favoritePoiIds: string[]): number {
  let score = 0;

  if (candidate.distanceMeters <= preference.distanceMeters) score += 30;
  else score -= Math.min(30, Math.floor((candidate.distanceMeters - preference.distanceMeters) / 100));

  if (preference.budgetPerPerson && candidate.avgPrice) {
    score += candidate.avgPrice <= preference.budgetPerPerson + 10 ? 20 : -15;
  }

  if (includesAny(candidate.tags.concat(candidate.name, candidate.category), preference.cravings)) score += 25;
  if (includesAny(candidate.tags.concat(candidate.name, candidate.category), preference.avoid)) score -= 30;
  if (candidate.openNow === true) score += 10;
  if (favoritePoiIds.includes(candidate.poiId)) score += 5;

  const rating = Number(candidate.rating);
  if (Number.isFinite(rating)) score += Math.round(rating * 3);

  return score;
}

export function rankCandidates(input: RankCandidatesInput): RestaurantCandidate[] {
  const excluded = new Set(input.excludedPoiIds);
  return input.candidates
    .filter((candidate) => !excluded.has(candidate.poiId))
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, input.preference, input.favoritePoiIds)
    }))
    .sort((a, b) => b.score - a.score || a.candidate.distanceMeters - b.candidate.distanceMeters)
    .map((item) => item.candidate);
}
```

- [ ] **Step 4: Implement AI reason writer**

Create `E:\fanzainai\server\src\services\reasonWriter.ts`:

```ts
import type { ParsedPreference, RestaurantCandidate } from '../schemas/recommendation.js';
import type { AiCompleteJson } from './aiClient.js';

type ReasonPayload = {
  reason: string;
};

export async function writeRecommendationReason(input: {
  aiCompleteJson: AiCompleteJson;
  preference: ParsedPreference;
  restaurant: RestaurantCandidate;
}): Promise<string> {
  try {
    const result = await input.aiCompleteJson<ReasonPayload>([
      {
        role: 'system',
        content: '你是开饭狸的饭饭狸。只输出 JSON，字段 reason 是 35 字以内中文推荐理由，亲切、具体、不夸张。'
      },
      {
        role: 'user',
        content: JSON.stringify({
          preference: input.preference,
          restaurant: input.restaurant
        })
      }
    ]);
    return result.reason || '这家距离和口味都比较符合你刚才的选择。';
  } catch {
    return '这家距离和口味都比较符合你刚才的选择。';
  }
}
```

- [ ] **Step 5: Write recommendation service test**

Create `E:\fanzainai\server\tests\recommendationService.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRecommendationService } from '../src/services/recommendationService.js';
import { candidateA, candidateB } from '../src/test/fixtures.js';

describe('createRecommendationService', () => {
  it('returns one primary recommendation and alternates', async () => {
    const service = createRecommendationService({
      amapClient: {
        searchRestaurants: async () => [candidateA, candidateB]
      },
      aiCompleteJson: async (messages) => {
        const system = messages[0]?.content || '';
        if (system.includes('偏好解析器')) {
          return {
            distanceMeters: 1500,
            budgetPerPerson: 35,
            spicyPreference: 'mild',
            cravings: ['热乎', '面食'],
            avoid: ['太辣'],
            mustOpenNow: true
          };
        }
        return { reason: '热乎、近，而且预算也合适。' };
      }
    });

    const result = await service.recommend({
      location: { latitude: 31.2304, longitude: 121.4737 },
      textPreference: '想吃热乎的',
      quickFilters: {
        distanceMeters: 1500,
        budgetPerPerson: 35,
        spicyPreference: 'mild',
        craving: '面食',
        openNow: true
      },
      localContext: {
        excludedPoiIds: [],
        favoritePoiIds: []
      }
    });

    expect(result.primaryRecommendation.poiId).toBe('B002');
    expect(result.primaryRecommendation.reason).toBe('热乎、近，而且预算也合适。');
    expect(result.alternatives).toHaveLength(1);
  });
});
```

- [ ] **Step 6: Implement recommendation service**

Create `E:\fanzainai\server\src\services\recommendationService.ts`:

```ts
import type { RecommendationRequest, RecommendationResponse } from '../schemas/recommendation.js';
import type { AiCompleteJson } from './aiClient.js';
import type { AmapClient } from './amapClient.js';
import { parsePreference } from './preferenceParser.js';
import { rankCandidates } from './ranker.js';
import { writeRecommendationReason } from './reasonWriter.js';

type RecommendationServiceDeps = {
  amapClient: AmapClient;
  aiCompleteJson: AiCompleteJson;
};

export function createRecommendationService(deps: RecommendationServiceDeps) {
  return {
    async recommend(request: RecommendationRequest): Promise<RecommendationResponse> {
      const parsedPreference = await parsePreference({
        textPreference: request.textPreference,
        quickFilters: request.quickFilters,
        aiCompleteJson: deps.aiCompleteJson
      });

      const candidates = await deps.amapClient.searchRestaurants({
        location: request.location,
        radiusMeters: parsedPreference.distanceMeters,
        keywords: parsedPreference.cravings
      });

      const ranked = rankCandidates({
        candidates,
        preference: parsedPreference,
        excludedPoiIds: request.localContext.excludedPoiIds,
        favoritePoiIds: request.localContext.favoritePoiIds
      });

      if (ranked.length === 0) {
        throw new Error('NO_RESTAURANTS_FOUND');
      }

      const primary = ranked[0];
      const reason = await writeRecommendationReason({
        aiCompleteJson: deps.aiCompleteJson,
        preference: parsedPreference,
        restaurant: primary
      });

      return {
        requestId: `rec_${Date.now()}`,
        parsedPreference,
        primaryRecommendation: {
          ...primary,
          reason
        },
        alternatives: ranked.slice(1, 3)
      };
    }
  };
}
```

- [ ] **Step 7: Run service tests and build**

Run:

```powershell
npm --workspace server test -- tests/ranker.test.ts tests/recommendationService.test.ts
npm run build:server
```

Expected: tests PASS and TypeScript build succeeds.

- [ ] **Step 8: Commit ranking and service**

Run:

```powershell
git add server/src/services/ranker.ts server/src/services/reasonWriter.ts server/src/services/recommendationService.ts server/tests/ranker.test.ts server/tests/recommendationService.test.ts
git commit -m "feat: rank restaurants and compose recommendations"
```

Expected: commit succeeds.

## Task 6: Fastify API Route

**Files:**
- Create: `E:\fanzainai\server\src\app.ts`
- Create: `E:\fanzainai\server\src\server.ts`
- Create: `E:\fanzainai\server\src\routes\recommendations.ts`
- Create: `E:\fanzainai\server\tests\recommendations.route.test.ts`

- [ ] **Step 1: Write route test**

Create `E:\fanzainai\server\tests\recommendations.route.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { candidateA } from '../src/test/fixtures.js';

describe('POST /api/recommendations', () => {
  it('returns a recommendation response for valid input', async () => {
    const app = buildApp({
      recommendationService: {
        recommend: async () => ({
          requestId: 'rec_test',
          parsedPreference: {
            distanceMeters: 1500,
            budgetPerPerson: 30,
            spicyPreference: 'mild',
            cravings: ['米饭'],
            avoid: ['太辣'],
            mustOpenNow: true
          },
          primaryRecommendation: {
            ...candidateA,
            reason: '离你近，口味也合适。'
          },
          alternatives: []
        })
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/recommendations',
      payload: {
        location: { latitude: 31.2304, longitude: 121.4737 },
        textPreference: '不太辣',
        quickFilters: {
          distanceMeters: 1500,
          budgetPerPerson: 30,
          spicyPreference: 'mild',
          craving: '米饭',
          openNow: true
        },
        localContext: {
          excludedPoiIds: [],
          favoritePoiIds: []
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().primaryRecommendation.name).toBe('巷口小厨');
  });

  it('returns 400 for invalid location', async () => {
    const app = buildApp({
      recommendationService: {
        recommend: async () => {
          throw new Error('should not be called');
        }
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/recommendations',
      payload: {
        location: { latitude: 200, longitude: 121.4737 },
        quickFilters: {
          distanceMeters: 1500,
          openNow: true
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe('Invalid recommendation request');
  });
});
```

- [ ] **Step 2: Run route test and verify failure**

Run:

```powershell
npm --workspace server test -- tests/recommendations.route.test.ts
```

Expected: FAIL because API files do not exist.

- [ ] **Step 3: Implement recommendations route**

Create `E:\fanzainai\server\src\routes\recommendations.ts`:

```ts
import type { FastifyInstance } from 'fastify';
import { RecommendationRequestSchema } from '../schemas/recommendation.js';

export type RecommendationService = {
  recommend(request: unknown): Promise<unknown>;
};

export async function registerRecommendationRoutes(
  app: FastifyInstance,
  deps: { recommendationService: RecommendationService }
) {
  app.post('/api/recommendations', async (request, reply) => {
    const parsed = RecommendationRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: 'Invalid recommendation request',
        issues: parsed.error.flatten()
      });
    }

    try {
      const result = await deps.recommendationService.recommend(parsed.data);
      return reply.send(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'NO_RESTAURANTS_FOUND') {
        return reply.status(404).send({ message: 'No matching restaurants found' });
      }
      request.log.error(error);
      return reply.status(502).send({ message: 'Recommendation service failed' });
    }
  });
}
```

- [ ] **Step 4: Implement app builder**

Create `E:\fanzainai\server\src\app.ts`:

```ts
import cors from '@fastify/cors';
import Fastify from 'fastify';
import { registerRecommendationRoutes, type RecommendationService } from './routes/recommendations.js';

export function buildApp(deps: { recommendationService: RecommendationService }) {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: true
  });

  app.get('/health', async () => ({ ok: true }));
  app.register(registerRecommendationRoutes, deps);

  return app;
}
```

- [ ] **Step 5: Implement server entry**

Create `E:\fanzainai\server\src\server.ts`:

```ts
import { loadConfig } from './config.js';
import { buildApp } from './app.js';
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
```

- [ ] **Step 6: Run route tests and build**

Run:

```powershell
npm --workspace server test -- tests/recommendations.route.test.ts
npm run build:server
```

Expected: tests PASS and TypeScript build succeeds.

- [ ] **Step 7: Commit API route**

Run:

```powershell
git add server/src/app.ts server/src/server.ts server/src/routes/recommendations.ts server/tests/recommendations.route.test.ts
git commit -m "feat: expose recommendation api"
```

Expected: commit succeeds.

## Task 7: Mini Program Shell And Brand Assets

**Files:**
- Create: `E:\fanzainai\miniprogram\project.config.json`
- Create: `E:\fanzainai\miniprogram\app.json`
- Create: `E:\fanzainai\miniprogram\app.js`
- Create: `E:\fanzainai\miniprogram\app.wxss`
- Copy: `E:\fanzainai\assets\brand\kaifanli-avatar-144.png` to `E:\fanzainai\miniprogram\assets\brand\kaifanli-avatar-144.png`

- [ ] **Step 1: Copy brand avatar into mini program**

Run:

```powershell
New-Item -ItemType Directory -Force -Path miniprogram/assets/brand
Copy-Item -LiteralPath assets/brand/kaifanli-avatar-144.png -Destination miniprogram/assets/brand/kaifanli-avatar-144.png -Force
```

Expected: avatar exists at `miniprogram/assets/brand/kaifanli-avatar-144.png`.

- [ ] **Step 2: Create WeChat project config**

Create `E:\fanzainai\miniprogram\project.config.json`:

```json
{
  "description": "开饭狸微信小程序 MVP",
  "packOptions": {
    "ignore": []
  },
  "setting": {
    "urlCheck": true,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true
  },
  "compileType": "miniprogram",
  "libVersion": "latest",
  "appid": "touristappid",
  "projectname": "kaifanli",
  "condition": {}
}
```

Use the real AppID in WeChat DevTools local project settings. Keep committed `project.config.json` on `touristappid` so secrets and account metadata do not enter the repo.

- [ ] **Step 3: Create app config**

Create `E:\fanzainai\miniprogram\app.json`:

```json
{
  "pages": [
    "pages/index/index"
  ],
  "window": {
    "navigationBarTitleText": "开饭狸",
    "navigationBarBackgroundColor": "#F24B3A",
    "navigationBarTextStyle": "white",
    "backgroundColor": "#FFF8EF"
  },
  "permission": {
    "scope.userLocation": {
      "desc": "开饭狸需要你的位置信息，用来推荐附近可以吃的餐厅。"
    }
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

- [ ] **Step 4: Create app JS**

Create `E:\fanzainai\miniprogram\app.js`:

```js
App({
  globalData: {
    apiBaseUrl: 'http://127.0.0.1:8787'
  }
});
```

- [ ] **Step 5: Create global styles**

Create `E:\fanzainai\miniprogram\app.wxss`:

```css
page {
  min-height: 100%;
  background: #fff8ef;
  color: #2f2926;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
}

button {
  font: inherit;
}

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

- [ ] **Step 6: Create sitemap**

Create `E:\fanzainai\miniprogram\sitemap.json`:

```json
{
  "rules": [
    {
      "action": "allow",
      "page": "*"
    }
  ]
}
```

- [ ] **Step 7: Commit mini program shell**

Run:

```powershell
git add miniprogram
git commit -m "feat: add mini program shell and brand asset"
```

Expected: commit succeeds.

## Task 8: Mini Program Utilities

**Files:**
- Create: `E:\fanzainai\miniprogram\utils\storage.js`
- Create: `E:\fanzainai\miniprogram\utils\api.js`
- Create: `E:\fanzainai\miniprogram\utils\viewModel.js`

- [ ] **Step 1: Create local storage utility**

Create `E:\fanzainai\miniprogram\utils\storage.js`:

```js
const KEYS = {
  recentPreference: 'kaifanli:recentPreference',
  favorites: 'kaifanli:favorites',
  excluded: 'kaifanli:excluded'
};

function getArray(key) {
  return wx.getStorageSync(key) || [];
}

function setArray(key, value) {
  wx.setStorageSync(key, value);
}

function upsertByPoiId(key, restaurant) {
  const items = getArray(key).filter((item) => item.poiId !== restaurant.poiId);
  items.unshift(restaurant);
  setArray(key, items.slice(0, 50));
}

module.exports = {
  getRecentPreference() {
    return wx.getStorageSync(KEYS.recentPreference) || '';
  },
  setRecentPreference(value) {
    wx.setStorageSync(KEYS.recentPreference, value || '');
  },
  getFavorites() {
    return getArray(KEYS.favorites);
  },
  addFavorite(restaurant) {
    upsertByPoiId(KEYS.favorites, restaurant);
  },
  getExcludedPoiIds() {
    return getArray(KEYS.excluded).map((item) => item.poiId);
  },
  addExcluded(restaurant) {
    upsertByPoiId(KEYS.excluded, restaurant);
  }
};
```

- [ ] **Step 2: Create API utility**

Create `E:\fanzainai\miniprogram\utils\api.js`:

```js
function requestRecommendation(payload) {
  const app = getApp();
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBaseUrl}/api/recommendations`,
      method: 'POST',
      data: payload,
      timeout: 15000,
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
          return;
        }
        reject(new Error(response.data?.message || '推荐服务暂时不可用'));
      },
      fail(error) {
        reject(new Error(error.errMsg || '网络连接失败'));
      }
    });
  });
}

module.exports = {
  requestRecommendation
};
```

- [ ] **Step 3: Create view model utility**

Create `E:\fanzainai\miniprogram\utils\viewModel.js`:

```js
function buildRecommendationPayload({ location, textPreference, filters, excludedPoiIds, favoritePoiIds }) {
  return {
    location,
    textPreference,
    quickFilters: {
      distanceMeters: filters.distanceMeters,
      budgetPerPerson: filters.budgetPerPerson,
      spicyPreference: filters.spicyPreference,
      craving: filters.craving,
      openNow: filters.openNow
    },
    localContext: {
      excludedPoiIds,
      favoritePoiIds
    }
  };
}

function formatDistance(distanceMeters) {
  if (distanceMeters < 1000) return `${distanceMeters}m`;
  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

module.exports = {
  buildRecommendationPayload,
  formatDistance
};
```

- [ ] **Step 4: Commit utilities**

Run:

```powershell
git add miniprogram/utils
git commit -m "feat: add mini program api and storage utilities"
```

Expected: commit succeeds.

## Task 9: Mini Program Components

**Files:**
- Create component files under `E:\fanzainai\miniprogram\components\preference-chip\`
- Create component files under `E:\fanzainai\miniprogram\components\mascot-state\`
- Create component files under `E:\fanzainai\miniprogram\components\restaurant-row\`
- Create component files under `E:\fanzainai\miniprogram\components\recommendation-card\`

- [ ] **Step 1: Create preference chip component**

Create `preference-chip.json`:

```json
{
  "component": true
}
```

Create `preference-chip.wxml`:

```xml
<view class="chip {{selected ? 'chip--selected' : ''}}" bindtap="handleTap">
  <text>{{label}}</text>
</view>
```

Create `preference-chip.js`:

```js
Component({
  properties: {
    label: String,
    value: null,
    selected: Boolean
  },
  methods: {
    handleTap() {
      this.triggerEvent('select', {
        value: this.properties.value
      });
    }
  }
});
```

Create `preference-chip.wxss`:

```css
.chip {
  min-height: 64rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #5f514b;
  border: 2rpx solid #f1ded4;
  font-size: 26rpx;
}

.chip--selected {
  background: #f24b3a;
  color: #fff;
  border-color: #f24b3a;
}
```

- [ ] **Step 2: Create mascot state component**

Create `mascot-state.json`:

```json
{
  "component": true
}
```

Create `mascot-state.wxml`:

```xml
<view class="state">
  <image class="state__avatar" src="/assets/brand/kaifanli-avatar-144.png" mode="aspectFit" />
  <view class="state__text">
    <view class="state__title">{{title}}</view>
    <view class="state__body">{{body}}</view>
  </view>
</view>
```

Create `mascot-state.js`:

```js
Component({
  properties: {
    title: String,
    body: String
  }
});
```

Create `mascot-state.wxss`:

```css
.state {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: #fff;
  border: 2rpx solid #f4e3d9;
}

.state__avatar {
  width: 88rpx;
  height: 88rpx;
  flex: none;
}

.state__title {
  color: #2f2926;
  font-size: 30rpx;
  font-weight: 700;
}

.state__body {
  margin-top: 8rpx;
  color: #8a7469;
  font-size: 24rpx;
  line-height: 1.5;
}
```

- [ ] **Step 3: Create restaurant row component**

Create `restaurant-row.json`:

```json
{
  "component": true
}
```

Create `restaurant-row.wxml`:

```xml
<view class="row">
  <view class="row__main">
    <view class="row__name">{{restaurant.name}}</view>
    <view class="row__meta">{{restaurant.category}} · {{distanceText}} · 人均{{restaurant.avgPrice || '-'}}元</view>
  </view>
  <button class="row__button" bindtap="handleChoose">看看</button>
</view>
```

Create `restaurant-row.js`:

```js
const { formatDistance } = require('../../utils/viewModel');

Component({
  properties: {
    restaurant: Object
  },
  data: {
    distanceText: ''
  },
  observers: {
    restaurant(value) {
      this.setData({
        distanceText: value ? formatDistance(value.distanceMeters) : ''
      });
    }
  },
  methods: {
    handleChoose() {
      this.triggerEvent('choose', {
        restaurant: this.properties.restaurant
      });
    }
  }
});
```

Create `restaurant-row.wxss`:

```css
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-top: 2rpx solid #f4e3d9;
}

.row__name {
  font-size: 30rpx;
  font-weight: 700;
  color: #2f2926;
}

.row__meta {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8a7469;
}

.row__button {
  width: 104rpx;
  height: 56rpx;
  line-height: 56rpx;
  border-radius: 999rpx;
  background: #fff0d4;
  color: #7b4d00;
  font-size: 24rpx;
  padding: 0;
}
```

- [ ] **Step 4: Create recommendation card component**

Create `recommendation-card.json`:

```json
{
  "component": true
}
```

Create `recommendation-card.wxml`:

```xml
<view class="card" wx:if="{{restaurant}}">
  <view class="card__badge">饭饭狸推荐</view>
  <view class="card__name">{{restaurant.name}}</view>
  <view class="card__meta">{{restaurant.category}} · {{distanceText}} · 人均{{restaurant.avgPrice || '-'}}元</view>
  <view class="card__tags">
    <text wx:for="{{restaurant.tags}}" wx:key="*this" class="card__tag">{{item}}</text>
  </view>
  <view class="card__reason">{{restaurant.reason}}</view>
</view>
```

Create `recommendation-card.js`:

```js
const { formatDistance } = require('../../utils/viewModel');

Component({
  properties: {
    restaurant: Object
  },
  data: {
    distanceText: ''
  },
  observers: {
    restaurant(value) {
      this.setData({
        distanceText: value ? formatDistance(value.distanceMeters) : ''
      });
    }
  }
});
```

Create `recommendation-card.wxss`:

```css
.card {
  padding: 32rpx;
  border-radius: 32rpx;
  background: #ffffff;
  border: 2rpx solid #f4e3d9;
}

.card__badge {
  display: inline-flex;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: #e9f5df;
  color: #3f7a2d;
  font-size: 24rpx;
  font-weight: 700;
}

.card__name {
  margin-top: 20rpx;
  font-size: 40rpx;
  font-weight: 800;
  color: #2f2926;
}

.card__meta {
  margin-top: 10rpx;
  color: #7c6b62;
  font-size: 26rpx;
}

.card__tags {
  margin-top: 20rpx;
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.card__tag {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: #fff2e8;
  color: #9a4a22;
  font-size: 22rpx;
}

.card__reason {
  margin-top: 24rpx;
  color: #4c403b;
  font-size: 28rpx;
  line-height: 1.6;
}
```

- [ ] **Step 5: Commit components**

Run:

```powershell
git add miniprogram/components
git commit -m "feat: add kaifanli mini program components"
```

Expected: commit succeeds.

## Task 10: Mini Program Home Page

**Files:**
- Create: `E:\fanzainai\miniprogram\pages\index\index.json`
- Create: `E:\fanzainai\miniprogram\pages\index\index.wxml`
- Create: `E:\fanzainai\miniprogram\pages\index\index.wxss`
- Create: `E:\fanzainai\miniprogram\pages\index\index.js`

- [ ] **Step 1: Create page config**

Create `index.json`:

```json
{
  "usingComponents": {
    "preference-chip": "../../components/preference-chip/preference-chip",
    "mascot-state": "../../components/mascot-state/mascot-state",
    "recommendation-card": "../../components/recommendation-card/recommendation-card",
    "restaurant-row": "../../components/restaurant-row/restaurant-row"
  },
  "navigationBarTitleText": "开饭狸"
}
```

- [ ] **Step 2: Create page markup**

Create `index.wxml`:

```xml
<view class="page safe-bottom">
  <view class="hero">
    <image class="hero__avatar" src="/assets/brand/kaifanli-avatar-144.png" mode="aspectFit" />
    <view>
      <view class="hero__brand">开饭狸</view>
      <view class="hero__title">今天想吃什么？</view>
      <view class="hero__subtitle">说给饭饭狸听，少纠结，快开饭。</view>
    </view>
  </view>

  <textarea
    class="preference-input"
    placeholder="比如：想吃热乎的，不太辣，别太远"
    maxlength="160"
    value="{{textPreference}}"
    bindinput="handleTextInput"
  />

  <view class="chips">
    <preference-chip wx:for="{{distanceOptions}}" wx:key="label" label="{{item.label}}" value="{{item.value}}" selected="{{filters.distanceMeters === item.value}}" bind:select="handleDistanceSelect" />
  </view>

  <view class="chips">
    <preference-chip wx:for="{{budgetOptions}}" wx:key="label" label="{{item.label}}" value="{{item.value}}" selected="{{filters.budgetPerPerson === item.value}}" bind:select="handleBudgetSelect" />
  </view>

  <view class="chips">
    <preference-chip wx:for="{{spicyOptions}}" wx:key="label" label="{{item.label}}" value="{{item.value}}" selected="{{filters.spicyPreference === item.value}}" bind:select="handleSpicySelect" />
  </view>

  <view class="chips">
    <preference-chip wx:for="{{cravingOptions}}" wx:key="label" label="{{item.label}}" value="{{item.value}}" selected="{{filters.craving === item.value}}" bind:select="handleCravingSelect" />
  </view>

  <button class="primary-button" loading="{{loading}}" bindtap="handleRecommend">让饭饭狸拍板</button>

  <mascot-state wx:if="{{status === 'idle'}}" title="饭饭狸准备好了" body="填一句今天的感觉，或者直接点按钮试试。" />
  <mascot-state wx:elif="{{status === 'locating'}}" title="正在定位" body="饭饭狸先看看你附近有什么好吃的。" />
  <mascot-state wx:elif="{{status === 'loading'}}" title="正在找店" body="附近好吃的正在赶来。" />
  <mascot-state wx:elif="{{status === 'error'}}" title="这次没找顺" body="{{errorMessage}}" />

  <view wx:if="{{status === 'success'}}" class="results">
    <recommendation-card restaurant="{{primaryRecommendation}}" />
    <view class="alternates" wx:if="{{alternatives.length}}">
      <view class="section-title">备选也不错</view>
      <restaurant-row wx:for="{{alternatives}}" wx:key="poiId" restaurant="{{item}}" bind:choose="handleChooseAlternate" />
    </view>
    <view class="action-bar">
      <button class="ghost-button" bindtap="handleRefresh">换一批</button>
      <button class="ghost-button" bindtap="handleFavorite">收藏</button>
      <button class="ghost-button" bindtap="handleDislike">不喜欢</button>
      <button class="nav-button" bindtap="handleNavigate">带我去</button>
    </view>
  </view>
</view>
```

- [ ] **Step 3: Create page behavior**

Create `index.js`:

```js
const storage = require('../../utils/storage');
const { requestRecommendation } = require('../../utils/api');
const { buildRecommendationPayload } = require('../../utils/viewModel');

Page({
  data: {
    status: 'idle',
    loading: false,
    errorMessage: '',
    location: null,
    textPreference: '',
    filters: {
      distanceMeters: 1500,
      budgetPerPerson: 30,
      spicyPreference: 'mild',
      craving: '米饭',
      openNow: true
    },
    distanceOptions: [
      { label: '15分钟内', value: 1500 },
      { label: '近一点', value: 800 },
      { label: '远点也行', value: 3000 }
    ],
    budgetOptions: [
      { label: '30元内', value: 30 },
      { label: '50元内', value: 50 },
      { label: '今天吃好点', value: 100 }
    ],
    spicyOptions: [
      { label: '不太辣', value: 'mild' },
      { label: '不吃辣', value: 'none' },
      { label: '能吃辣', value: 'spicy' }
    ],
    cravingOptions: [
      { label: '想吃米饭', value: '米饭' },
      { label: '热乎的', value: '热乎' },
      { label: '来碗面', value: '面食' },
      { label: '清淡点', value: '清淡' }
    ],
    primaryRecommendation: null,
    alternatives: []
  },

  onLoad() {
    this.setData({
      textPreference: storage.getRecentPreference()
    });
  },

  handleTextInput(event) {
    this.setData({
      textPreference: event.detail.value
    });
  },

  handleDistanceSelect(event) {
    this.setData({ 'filters.distanceMeters': event.detail.value });
  },

  handleBudgetSelect(event) {
    this.setData({ 'filters.budgetPerPerson': event.detail.value });
  },

  handleSpicySelect(event) {
    this.setData({ 'filters.spicyPreference': event.detail.value });
  },

  handleCravingSelect(event) {
    this.setData({ 'filters.craving': event.detail.value });
  },

  getLocation() {
    this.setData({ status: 'locating' });
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          const location = {
            latitude: res.latitude,
            longitude: res.longitude
          };
          this.setData({ location });
          resolve(location);
        },
        fail: () => reject(new Error('饭饭狸需要定位，才能找到你附近能吃的地方。'))
      });
    });
  },

  async handleRecommend() {
    if (this.data.loading) return;
    this.setData({ loading: true, status: 'loading', errorMessage: '' });

    try {
      const location = this.data.location || (await this.getLocation());
      storage.setRecentPreference(this.data.textPreference);
      const favorites = storage.getFavorites();
      const payload = buildRecommendationPayload({
        location,
        textPreference: this.data.textPreference,
        filters: this.data.filters,
        excludedPoiIds: storage.getExcludedPoiIds(),
        favoritePoiIds: favorites.map((item) => item.poiId)
      });
      const result = await requestRecommendation(payload);
      this.setData({
        status: 'success',
        primaryRecommendation: result.primaryRecommendation,
        alternatives: result.alternatives || []
      });
    } catch (error) {
      this.setData({
        status: 'error',
        errorMessage: error.message || '推荐服务暂时不可用，稍后再试试。'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleRefresh() {
    this.handleRecommend();
  },

  handleFavorite() {
    if (!this.data.primaryRecommendation) return;
    storage.addFavorite(this.data.primaryRecommendation);
    wx.showToast({ title: '饭饭狸记住啦', icon: 'none' });
  },

  handleDislike() {
    if (!this.data.primaryRecommendation) return;
    storage.addExcluded(this.data.primaryRecommendation);
    wx.showToast({ title: '这家先不看', icon: 'none' });
    this.handleRecommend();
  },

  handleChooseAlternate(event) {
    const selected = event.detail.restaurant;
    const alternatives = [this.data.primaryRecommendation].concat(
      this.data.alternatives.filter((item) => item.poiId !== selected.poiId)
    );
    this.setData({
      primaryRecommendation: selected,
      alternatives
    });
  },

  handleNavigate() {
    const restaurant = this.data.primaryRecommendation;
    if (!restaurant?.location) {
      wx.showToast({ title: '这家暂时没有坐标', icon: 'none' });
      return;
    }
    wx.openLocation({
      latitude: restaurant.location.latitude,
      longitude: restaurant.location.longitude,
      name: restaurant.name,
      address: restaurant.address
    });
  }
});
```

- [ ] **Step 4: Create page styles**

Create `index.wxss`:

```css
.page {
  padding: 32rpx 28rpx 48rpx;
}

.hero {
  display: flex;
  align-items: center;
  gap: 22rpx;
  margin-bottom: 28rpx;
}

.hero__avatar {
  width: 104rpx;
  height: 104rpx;
  flex: none;
}

.hero__brand {
  color: #f24b3a;
  font-size: 26rpx;
  font-weight: 800;
}

.hero__title {
  margin-top: 4rpx;
  color: #2f2926;
  font-size: 44rpx;
  font-weight: 900;
}

.hero__subtitle {
  margin-top: 6rpx;
  color: #8a7469;
  font-size: 24rpx;
}

.preference-input {
  width: 100%;
  min-height: 150rpx;
  box-sizing: border-box;
  padding: 28rpx;
  border-radius: 28rpx;
  background: #ffffff;
  border: 2rpx solid #f4e3d9;
  color: #2f2926;
  font-size: 28rpx;
  line-height: 1.5;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 18rpx;
}

.primary-button {
  margin: 28rpx 0;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 999rpx;
  background: #f24b3a;
  color: #fff;
  font-size: 30rpx;
  font-weight: 800;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.alternates {
  padding: 0 28rpx;
  border-radius: 28rpx;
  background: #fff;
  border: 2rpx solid #f4e3d9;
}

.section-title {
  padding: 24rpx 0 4rpx;
  color: #2f2926;
  font-size: 28rpx;
  font-weight: 800;
}

.action-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr) 1.35fr;
  gap: 12rpx;
}

.ghost-button,
.nav-button {
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 999rpx;
  padding: 0;
  font-size: 24rpx;
}

.ghost-button {
  background: #ffffff;
  color: #5f514b;
  border: 2rpx solid #f4e3d9;
}

.nav-button {
  background: #477f32;
  color: #fff;
  font-weight: 800;
}
```

- [ ] **Step 5: Open mini program in WeChat DevTools**

Run WeChat DevTools manually and open:

```text
E:\fanzainai\miniprogram
```

Expected: project opens, homepage renders, no missing component errors.

- [ ] **Step 6: Commit homepage**

Run:

```powershell
git add miniprogram/pages/index
git commit -m "feat: build recommendation home page"
```

Expected: commit succeeds.

## Task 11: Local Integration And Real Config

**Files:**
- Modify locally only: `E:\fanzainai\server\.env`
- Modify locally only through WeChat DevTools: mini program AppID/project settings

- [ ] **Step 1: Create local backend config**

Run:

```powershell
Copy-Item -LiteralPath server/.env.example -Destination server/.env
```

Expected: `server/.env` exists and is ignored by git.

- [ ] **Step 2: Fill local keys without committing them**

Set local PowerShell environment variables for this terminal session, then write `server\.env` from those variables:

```powershell
$env:KAIFANLI_AMAP_API_KEY = Read-Host 'AMap API Key'
$env:KAIFANLI_AI_API_KEY = Read-Host 'OpenAI-compatible API Key'
$env:KAIFANLI_AI_BASE_URL = Read-Host 'OpenAI-compatible Base URL'
$env:KAIFANLI_AI_MODEL = Read-Host 'OpenAI-compatible Model'

@"
API_PORT=8787
AMAP_API_KEY=$env:KAIFANLI_AMAP_API_KEY
OPENAI_COMPATIBLE_API_KEY=$env:KAIFANLI_AI_API_KEY
OPENAI_COMPATIBLE_BASE_URL=$env:KAIFANLI_AI_BASE_URL
OPENAI_COMPATIBLE_MODEL=$env:KAIFANLI_AI_MODEL
NODE_ENV=development
"@ | Set-Content -LiteralPath server/.env -Encoding utf8
```

Expected: `git status --short` does not show `server/.env`.

- [ ] **Step 3: Load env when starting server**

Install `dotenv-cli` for local development:

```powershell
npm --workspace server install -D dotenv-cli
```

Modify `E:\fanzainai\server\package.json` scripts:

```json
{
  "dev": "dotenv -e .env -- tsx watch src/server.ts",
  "build": "tsc -p tsconfig.json",
  "start": "node dist/server.js",
  "test": "vitest run"
}
```

- [ ] **Step 4: Start server**

Run:

```powershell
npm run dev:server
```

Expected: Fastify logs that it is listening on `0.0.0.0:8787`.

- [ ] **Step 5: Verify health endpoint**

In a second terminal run:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8787/health
```

Expected:

```powershell
ok
--
True
```

- [ ] **Step 6: Verify recommendation endpoint with a real location**

Run:

```powershell
$body = @{
  location = @{ latitude = 31.2304; longitude = 121.4737 }
  textPreference = '想吃热乎的，不太辣，别太远'
  quickFilters = @{
    distanceMeters = 1500
    budgetPerPerson = 30
    spicyPreference = 'mild'
    craving = '米饭'
    openNow = $true
  }
  localContext = @{
    excludedPoiIds = @()
    favoritePoiIds = @()
  }
} | ConvertTo-Json -Depth 6

Invoke-RestMethod -Uri http://127.0.0.1:8787/api/recommendations -Method Post -Body $body -ContentType 'application/json'
```

Expected: response contains `primaryRecommendation`, `alternatives`, and `parsedPreference`.

- [ ] **Step 7: Configure request domain for production testing**

For real-device or production preview, deploy the backend to an HTTPS domain and add it in WeChat mini program admin under request legal domains. Update `app.globalData.apiBaseUrl` in `miniprogram/app.js` for the deployed environment.

- [ ] **Step 8: Run tests after dotenv change**

Run:

```powershell
npm test
npm run build:server
```

Expected: all tests PASS and TypeScript build succeeds.

- [ ] **Step 9: Commit integration script change**

Run:

```powershell
git add package-lock.json server/package.json
git commit -m "chore: load local backend environment"
```

Expected: commit succeeds and no secret files are staged.

## Task 12: Final Verification

**Files:**
- Modify: `E:\fanzainai\README.md`

- [ ] **Step 1: Add verification notes to README**

Modify `E:\fanzainai\README.md`:

```md
# 开饭狸

开饭狸是一个微信小程序 MVP，用当前位置、口味偏好和附近餐厅数据，帮用户快速决定今天吃什么。

## 本地开发

1. 安装依赖：`npm install`
2. 复制后端配置：`Copy-Item server/.env.example server/.env`
3. 在 `server/.env` 中填写高德 Key 和 OpenAI-compatible Key
4. 启动后端：`npm run dev:server`
5. 用微信开发者工具打开 `miniprogram/`

真实微信 AppID 通过微信开发者工具或 `miniprogram/project.private.config.json` 本地配置，不提交到仓库。

## 验证清单

- `npm test`
- `npm run build:server`
- `Invoke-RestMethod -Uri http://127.0.0.1:8787/health`
- 微信开发者工具打开 `miniprogram/` 后，首页能显示开饭狸头像、偏好输入、筛选芯片和推荐按钮
- 填写偏好并点击“让饭饭狸拍板”后，能看到 1 个主推荐和备选餐厅
```

- [ ] **Step 2: Run automated verification**

Run:

```powershell
npm test
npm run build:server
```

Expected: all tests PASS and TypeScript build succeeds.

- [ ] **Step 3: Run git status**

Run:

```powershell
git status --short
```

Expected: only intended README change is listed before commit; `server/.env` is not listed.

- [ ] **Step 4: Commit final docs**

Run:

```powershell
git add README.md
git commit -m "docs: add kaifanli verification guide"
```

Expected: commit succeeds.

- [ ] **Step 5: Produce final handoff**

Report:

```text
Backend tests: npm test
Backend build: npm run build:server
Health endpoint: http://127.0.0.1:8787/health
Mini program path: E:\fanzainai\miniprogram
Avatar asset: E:\fanzainai\miniprogram\assets\brand\kaifanli-avatar-144.png
```

Expected: user can open WeChat DevTools and continue with real AppID/domain setup.

## Self-Review

- Spec coverage: The plan covers branding assets, native mini program shell, homepage, local storage, independent backend, AMap integration, AI parsing/reasoning, ranking, error handling, and verification.
- Scope control: Login, multiplayer voting, cloud sync, route-time calculation, payments, coupons, and merchant features remain out of MVP.
- Type consistency: Request/response types are defined once in `server/src/schemas/recommendation.ts`; downstream services use those types.
- Secret handling: AMap Key, AI Key, AI Base URL, AI model, and real WeChat AppID are local-only runtime settings and are not committed.
- Verification: Backend has automated tests and TypeScript build; mini program has manual WeChat DevTools verification because native mini program UI cannot be fully exercised by the backend test runner.
