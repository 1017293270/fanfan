import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { InviteCode, PublicUser } from '../api/types';
import { mascots, uiAssets } from '../assets/visualAssets';
import { BrandHeader } from '../components/BrandHeader';

type AdminScreenProps = {
  currentUser: PublicUser;
};

export function AdminScreen({ currentUser }: AdminScreenProps) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [newCode, setNewCode] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const [userResult, inviteResult] = await Promise.all([api.listUsers(), api.listInviteCodes()]);
    setUsers(userResult.users);
    setInviteCodes(inviteResult.inviteCodes);
  }

  useEffect(() => {
    if (currentUser.role === 'super_admin') void load();
  }, [currentUser.role]);

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
        <button className="primary-button primary-button--with-icon" type="button" onClick={createCode}>
          <img src={uiAssets.inviteTicket} alt="" />
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
          <button className="admin-row" type="button" key={code.id} onClick={() => disableCode(code)}>
            <span>
              <strong>{code.code}</strong>
              <small>{code.usedByUserId ? `已使用：${code.usedByUserId}` : '未使用'}</small>
            </span>
            <em>{code.status}</em>
          </button>
        ))}
      </section>
    </div>
  );
}
