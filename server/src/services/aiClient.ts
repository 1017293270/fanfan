import type { RuntimeConfig } from '../config.js';

export type AiCompleteJson = <T>(
  messages: Array<{ role: 'system' | 'user'; content: string }>
) => Promise<T>;

type AiMessage = Parameters<AiCompleteJson>[0][number];

export function createAiClient(config: RuntimeConfig): AiCompleteJson {
  return async function completeJson<T>(messages: AiMessage[]): Promise<T> {
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
