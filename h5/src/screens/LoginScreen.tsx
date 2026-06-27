import { useState } from 'react';
import { api, setStoredToken } from '../api/client';
import type { PublicUser } from '../api/types';
import { mascots, uiAssets } from '../assets/visualAssets';
import { BrandHeader } from '../components/BrandHeader';
import { validateAuthForm } from '../utils/authValidation';

type LoginScreenProps = {
  onAuth: (user: PublicUser, token: string) => void;
};

export function LoginScreen({ onAuth }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('admin');
  const [displayName, setDisplayName] = useState('饭饭狸管理员');
  const [inviteCode, setInviteCode] = useState('FANFAN-START');
  const [password, setPassword] = useState('change-me-local-admin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    const request = (() => {
      if (mode === 'login') {
        const validated = validateAuthForm({ mode, username, password });
        if (typeof validated === 'string') return validated;
        return api.login(validated);
      }

      const validated = validateAuthForm({ mode, inviteCode, username, displayName, password });
      if (typeof validated === 'string') return validated;
      return api.register(validated);
    })();

    if (typeof request === 'string') {
      setError(request);
      return;
    }

    setBusy(true);
    try {
      const result = await request;
      setStoredToken(result.token);
      onAuth(result.user, result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <BrandHeader mascotSrc={mascots.happy} title="今天想吃什么？" subtitle="先登录饭饭狸，记住你的公司、家和常吃店。" />
      <div className="asset-strip" aria-hidden="true">
        <img src={uiAssets.navHome} alt="" />
        <img src={uiAssets.navPlaces} alt="" />
        <img src={uiAssets.navStores} alt="" />
      </div>
      <section className="auth-card">
        <div className="segmented">
          <button className={mode === 'login' ? 'is-active' : ''} type="button" onClick={() => setMode('login')}>
            登录
          </button>
          <button className={mode === 'register' ? 'is-active' : ''} type="button" onClick={() => setMode('register')}>
            邀请注册
          </button>
        </div>
        {mode === 'register' ? (
          <label>
            邀请码
            <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} />
          </label>
        ) : null}
        <label>
          账号
          <input value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        {mode === 'register' ? (
          <label>
            昵称
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
        ) : null}
        <label>
          密码
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary-button" type="button" disabled={busy} onClick={submit}>
          {busy ? '饭饭狸处理中' : mode === 'login' ? '进入开饭狸' : '收下邀请'}
        </button>
        <button className="text-button" type="button" onClick={() => setError('请联系超级管理员重置密码。')}>
          忘记密码
        </button>
      </section>
      <section className="mini-story-card">
        <img src={mascots.thinking} alt="" />
        <div>
          <strong>账号会记住你的饭点习惯</strong>
          <span>公司、家和常吃店会分开推荐，越用越省心。</span>
        </div>
      </section>
    </main>
  );
}
