import type { ReactNode } from 'react';
import { BottomNav, type NavItem } from './BottomNav';

type AppShellProps = {
  children: ReactNode;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function AppShell({ children, navItems, activeTab, onTabChange }: AppShellProps) {
  return (
    <main className="phone-shell">
      <section className="phone-screen">{children}</section>
      <BottomNav items={navItems} activeTab={activeTab} onTabChange={onTabChange} />
    </main>
  );
}
