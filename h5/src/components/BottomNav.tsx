export type NavItem = {
  id: string;
  label: string;
  iconSrc: string;
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
        const active = item.id === activeTab;
        return (
          <button
            key={item.id}
            className={`bottom-nav__item ${active ? 'is-active' : ''}`}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => onTabChange(item.id)}
          >
            <img src={item.iconSrc} alt="" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
