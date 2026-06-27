import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('h5/src/styles/app.css', 'utf8');

describe('motion polish CSS', () => {
  it('defines gentle entrance and feedback animations', () => {
    expect(css).toContain('@keyframes kfl-breathe');
    expect(css).toContain('@keyframes kfl-sheet-in');
    expect(css).toContain('@keyframes kfl-pop-in');
    expect(css).toContain('@keyframes kfl-toast-in');
  });

  it('animates primary interaction surfaces without changing layout size', () => {
    expect(css).toMatch(/\.primary-button,\s*\.icon-button,\s*\.chip,\s*\.bottom-nav__item[\s\S]*transition:/);
    expect(css).toMatch(/\.bottom-nav__item\.is-active img[\s\S]*animation:\s*kfl-pop-in/);
    expect(css).toMatch(/\.recommend-card[\s\S]*animation:\s*kfl-card-in/);
    expect(css).toMatch(/\.state-card--busy img[\s\S]*animation:\s*kfl-breathe/);
  });

  it('respects reduced motion preferences', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toMatch(/animation-duration:\s*0\.01ms/);
  });
});
