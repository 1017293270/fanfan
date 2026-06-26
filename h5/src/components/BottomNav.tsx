import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type BottomNavProps = {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function BottomNav({ items, activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === activeTab;
        return (
          <button
            key={item.id}
            className={`bottom-nav__item ${active ? 'is-active' : ''}`}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => onTabChange(item.id)}
          >
            <Icon size={19} strokeWidth={2.4} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
