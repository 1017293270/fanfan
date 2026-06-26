import type { RuntimeConfig } from '../config.js';
import { hashPassword } from '../services/password.js';
import type { DataStore } from './types.js';

export async function seedInitialData(store: DataStore, config: RuntimeConfig): Promise<void> {
  if (config.adminUsername && config.adminPassword) {
    const existingAdmin = await store.users.findByUsername(config.adminUsername);
    if (!existingAdmin) {
      await store.users.create({
        username: config.adminUsername,
        displayName: config.adminDisplayName || '超级管理员',
        passwordHash: await hashPassword(config.adminPassword),
        role: 'super_admin'
      });
    }
  }

  if (config.initialInviteCode) {
    const existingInvite = await store.inviteCodes.findByCode(config.initialInviteCode);
    if (!existingInvite) {
      const admin = config.adminUsername ? await store.users.findByUsername(config.adminUsername) : undefined;
      await store.inviteCodes.create({
        code: config.initialInviteCode,
        createdByUserId: admin?.id,
        status: 'unused'
      });
    }
  }
}
