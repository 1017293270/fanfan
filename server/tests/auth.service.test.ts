import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/services/password.js';

describe('password service', () => {
  it('hashes passwords with a salt and verifies the original password', async () => {
    const hash = await hashPassword('secret-pass');

    expect(hash).toMatch(/^scrypt\$/);
    expect(hash).not.toContain('secret-pass');
    await expect(verifyPassword('secret-pass', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-pass', hash)).resolves.toBe(false);
  });
});
