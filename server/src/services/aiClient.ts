import type { RuntimeConfig } from '../config.js';

export type AiCompleteJson = <T>(
  messages: Array<{ role: 'system' | 'user'; content: string }>
) => Promise<T>;

type AiMessage = Parameters<AiCompleteJson>[0][number];

function shouldDisableMiniMaxThinking(config: RuntimeConfig): boolean {
  const provider = `${config.aiBaseUrl} ${config.aiModel}`.toLowerCase();
  return provider.includes('minimax') || provider.includes('minimaxi');
}

function parseJsonContent<T>(content: string): T {
  const withoutThinking = content.replace(/^\s*<think>[\s\S]*?<\/think>\s*/i, '').trim();
  const fenced = withoutThinking.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1].trim() : withoutThinking;
  return JSON.parse(candidate) as T;
}

export function createAiClient(config: RuntimeConfig): AiCompleteJson {
  return async function completeJson<T>(messages: AiMessage[]): Promise<T> {
    const requestBody: Record<string, unknown> = {
      model: config.aiModel,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages
    };
    if (shouldDisableMiniMaxThinking(config)) {
      requestBody.thinking = { type: 'disabled' };
    }

    const response = await fetch(`${config.aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.aiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
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

    return parseJsonContent<T>(content);
  };
}
