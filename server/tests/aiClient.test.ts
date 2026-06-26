import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAiClient } from '../src/services/aiClient.js';

const baseConfig = {
  apiPort: 8787,
  amapApiKey: 'amap-key',
  aiApiKey: 'ai-key',
  aiBaseUrl: 'https://api.openai.com/v1',
  aiModel: 'gpt-4.1-mini',
  nodeEnv: 'test'
};

describe('createAiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('disables MiniMax thinking output so JSON parsing receives clean content', async () => {
    let requestBody: Record<string, unknown> | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        requestBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"ok":true}' } }]
          }),
          { status: 200 }
        );
      })
    );

    const completeJson = createAiClient({
      ...baseConfig,
      aiBaseUrl: 'https://api.minimaxi.com/v1',
      aiModel: 'MiniMax-M3'
    });

    await expect(completeJson<{ ok: boolean }>([{ role: 'user', content: 'test' }])).resolves.toEqual({
      ok: true
    });
    expect(requestBody?.thinking).toEqual({ type: 'disabled' });
  });

  it('does not send MiniMax-only fields to generic OpenAI-compatible providers', async () => {
    let requestBody: Record<string, unknown> | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        requestBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"ok":true}' } }]
          }),
          { status: 200 }
        );
      })
    );

    const completeJson = createAiClient(baseConfig);

    await completeJson<{ ok: boolean }>([{ role: 'user', content: 'test' }]);
    expect(requestBody).not.toHaveProperty('thinking');
  });

  it('parses JSON wrapped in a markdown code fence', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: '```json\n{"ok":true}\n```' } }]
          }),
          { status: 200 }
        )
      )
    );

    const completeJson = createAiClient(baseConfig);

    await expect(completeJson<{ ok: boolean }>([{ role: 'user', content: 'test' }])).resolves.toEqual({
      ok: true
    });
  });
});
