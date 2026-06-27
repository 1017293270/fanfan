import { describe, expect, it } from 'vitest';
import { DEFAULT_LOGIN_PASSWORD, defaultPasswordForMode, validateAuthForm } from '../src/utils/authValidation';

describe('validateAuthForm', () => {
  it('does not reuse the default admin password for invite registration', () => {
    expect(defaultPasswordForMode('login')).toBe(DEFAULT_LOGIN_PASSWORD);
    expect(defaultPasswordForMode('register')).toBe('');
  });

  it('explains short register passwords before sending the request', () => {
    expect(
      validateAuthForm({
        mode: 'register',
        inviteCode: 'FAN-161Y5D',
        username: 'WZX',
        displayName: '小王',
        password: '1234567'
      })
    ).toBe('密码至少 8 位。');
  });

  it('normalizes register fields before submission', () => {
    expect(
      validateAuthForm({
        mode: 'register',
        inviteCode: ' fan-161y5d ',
        username: ' WZX ',
        displayName: ' 小王 ',
        password: '12345678'
      })
    ).toEqual({
      inviteCode: 'FAN-161Y5D',
      username: 'WZX',
      displayName: '小王',
      password: '12345678'
    });
  });

  it('keeps login validation small and direct', () => {
    expect(
      validateAuthForm({
        mode: 'login',
        username: '',
        password: '12345678'
      })
    ).toBe('请输入账号。');
  });
});
