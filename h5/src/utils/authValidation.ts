export type AuthMode = 'login' | 'register';

export const DEFAULT_LOGIN_PASSWORD = 'change-me-local-admin';

export function defaultPasswordForMode(mode: AuthMode) {
  return mode === 'login' ? DEFAULT_LOGIN_PASSWORD : '';
}

type LoginInput = {
  mode: Extract<AuthMode, 'login'>;
  username: string;
  password: string;
};

type RegisterInput = {
  mode: Extract<AuthMode, 'register'>;
  inviteCode: string;
  username: string;
  displayName: string;
  password: string;
};

type LoginPayload = {
  username: string;
  password: string;
};

type RegisterPayload = {
  inviteCode: string;
  username: string;
  displayName: string;
  password: string;
};

function cleanUsername(username: string) {
  return username.trim();
}

export function validateAuthForm(input: LoginInput): string | LoginPayload;
export function validateAuthForm(input: RegisterInput): string | RegisterPayload;
export function validateAuthForm(input: LoginInput | RegisterInput): string | LoginPayload | RegisterPayload {
  const username = cleanUsername(input.username);
  const password = input.password;

  if (!username) return '请输入账号。';
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return '账号只能使用字母、数字、下划线或短横线。';
  if (!password) return '请输入密码。';

  if (input.mode === 'login') {
    return { username, password };
  }

  const inviteCode = input.inviteCode.trim().toUpperCase();
  const displayName = input.displayName.trim();

  if (!inviteCode) return '请输入邀请码。';
  if (username.length < 3) return '账号至少 3 位。';
  if (!displayName) return '请输入昵称。';
  if (password.length < 8) return '密码至少 8 位。';

  return {
    inviteCode,
    username,
    displayName,
    password
  };
}
