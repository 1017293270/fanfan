import { describe, expect, it, vi } from 'vitest';
import { copyTextToClipboard } from '../src/utils/clipboard';

describe('copyTextToClipboard', () => {
  it('uses navigator clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await copyTextToClipboard('FANFAN-START', { clipboard: { writeText } });

    expect(writeText).toHaveBeenCalledWith('FANFAN-START');
  });

  it('falls back to a temporary textarea when clipboard api is unavailable', async () => {
    const appended: unknown[] = [];
    const selected: string[] = [];
    const textarea = {
      value: '',
      style: {},
      setAttribute: vi.fn(),
      select: vi.fn(() => selected.push(textarea.value)),
      remove: vi.fn()
    };
    const doc = {
      body: {
        appendChild: vi.fn((node: unknown) => appended.push(node))
      },
      createElement: vi.fn(() => textarea),
      execCommand: vi.fn(() => true)
    };

    await copyTextToClipboard('FANFAN-START', { document: doc });

    expect(appended).toEqual([textarea]);
    expect(selected).toEqual(['FANFAN-START']);
    expect(doc.execCommand).toHaveBeenCalledWith('copy');
    expect(textarea.remove).toHaveBeenCalled();
  });
});
