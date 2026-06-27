import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sheetSource = readFileSync('h5/src/components/Sheet.tsx', 'utf8');
const cssSource = readFileSync('h5/src/styles/app.css', 'utf8');

function block(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = cssSource.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 's'));
  if (!match) throw new Error(`Missing CSS block for ${selector}`);
  return match[1];
}

function zIndex(selector: string) {
  const match = block(selector).match(/z-index:\s*(\d+)/);
  if (!match) throw new Error(`Missing z-index for ${selector}`);
  return Number(match[1]);
}

describe('Sheet layering', () => {
  it('renders sheets through a body portal instead of inside the page shell', () => {
    expect(sheetSource).toContain("from 'react-dom'");
    expect(sheetSource).toContain('createPortal(');
    expect(sheetSource).toContain('document.body');
  });

  it('keeps sheets above the fixed bottom navigation', () => {
    expect(zIndex('.sheet-layer')).toBeGreaterThan(zIndex('.bottom-nav'));
    expect(zIndex('.sheet-layer')).toBeGreaterThanOrEqual(100);
  });

  it('keeps sheet action buttons separated from the browser safe area', () => {
    const actions = block('.sheet-actions');

    expect(actions).toContain('margin-top:');
    expect(actions).toContain('padding-bottom:');
    expect(actions).toContain('env(safe-area-inset-bottom)');
  });
});
