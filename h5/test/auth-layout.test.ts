import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const cssSource = readFileSync('h5/src/styles/app.css', 'utf8');

function blocks(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...cssSource.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'gs'))];
  if (!matches.length) throw new Error(`Missing CSS block for ${selector}`);
  return matches.map((match) => match[1]).join('\n');
}

describe('auth mobile layout', () => {
  it('leaves extra bottom room for mobile browser chrome', () => {
    const authScreen = blocks('.auth-screen');

    expect(authScreen).toContain('min-height: 100dvh');
    expect(authScreen).toContain('padding-bottom:');
    expect(authScreen).toContain('env(safe-area-inset-bottom)');
  });
});
