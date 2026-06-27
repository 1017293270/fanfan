import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { InviteCode, InviteCodeStatus, PublicUser } from '../api/types';
import { mascots, uiAssets } from '../assets/visualAssets';
import { BrandHeader } from '../components/BrandHeader';
import { copyTextToClipboard } from '../utils/clipboard';

type AdminScreenProps = {
  currentUser: PublicUser;
};

const inviteCodeStatusText: Record<InviteCodeStatus, string> = {
  unused: '未使用',
  used: '已使用',
  disabled: '已停用'
};

export function AdminScreen({ currentUser }: AdminScreenProps) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [newCode, setNewCode] = useState('');
  const [message, setMessage] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState('');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    const [userResult, inviteResult] = await Promise.all([api.listUsers(), api.listInviteCodes()]);
    setUsers(userResult.users);
    setInviteCodes(inviteResult.inviteCodes);
  }

  useEffect(() => {
    if (currentUser.role === 'super_admin') void load();
  }, [currentUser.role]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  async function createCode() {
    const result = await api.createInviteCode(newCode || undefined);
    setMessage(`邀请码：${result.inviteCode.code}`);
    setNewCode('');
    await load();
  }

  async function toggleUser(user: PublicUser) {
    await api.updateUserStatus(user.id, user.status === 'active' ? 'disabled' : 'active');
    await load();
  }

  async function disableCode(code: InviteCode) {
    await api.updateInviteCodeStatus(code.id, 'disabled');
    await load();
  }

  async function copyInviteCode(code: InviteCode) {
    try {
      await copyTextToClipboard(code.code);
      setCopiedCodeId(code.id);
      setMessage(`已复制邀请码：${code.code}`);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedCodeId(''), 1500);
    } catch {
      setMessage('复制失败，可以长按邀请码手动复制。');
    }
  }

  if (currentUser.role !== 'super_admin') {
    return (
      <div className="screen-flow">
        <BrandHeader compact mascotSrc={mascots.thinking} title="我的账号" subtitle="普通账号只管理自己的地点和店铺。" />
      </div>
    );
  }

  return (
    <div className="screen-flow">
      <BrandHeader compact mascotSrc={mascots.thinking} title="管理员" subtitle="看账号，发邀请码，不碰用户密码。" />
      <section className="search-card">
        <div className="search-card__intro">
          <img src={uiAssets.inviteTicket} alt="" />
          <span>只做账号和邀请码管理，不保存明文密码。</span>
        </div>
        <label>
          新邀请码
          <input placeholder="留空自动生成" value={newCode} onChange={(event) => setNewCode(event.target.value)} />
        </label>
        <button className="primary-button" type="button" onClick={createCode}>
          生成邀请码
        </button>
        {message ? <div className="form-error form-error--soft">{message}</div> : null}
      </section>
      <section className="list-card">
        <h2>账号</h2>
        {users.map((user) => (
          <button className="admin-row" type="button" key={user.id} onClick={() => toggleUser(user)}>
            <span>
              <strong>{user.displayName}</strong>
              <small>
                {user.username} · {user.role === 'super_admin' ? '管理员' : '用户'}
              </small>
            </span>
            <em>{user.status === 'active' ? '启用' : '停用'}</em>
          </button>
        ))}
      </section>
      <section className="list-card">
        <h2>邀请码</h2>
        {inviteCodes.map((code) => (
          <div className="admin-row admin-row--static" key={code.id}>
            <span>
              <strong>{code.code}</strong>
              <small>{code.usedByUserId ? `已使用：${code.usedByUserId}` : '未使用'}</small>
            </span>
            <div className="admin-row__actions">
              <em>{inviteCodeStatusText[code.status]}</em>
              <button className="admin-row__button admin-row__button--copy" type="button" onClick={() => void copyInviteCode(code)}>
                {copiedCodeId === code.id ? '已复制' : '复制'}
              </button>
              <button className="admin-row__button" type="button" disabled={code.status === 'disabled'} onClick={() => void disableCode(code)}>
                停用
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
