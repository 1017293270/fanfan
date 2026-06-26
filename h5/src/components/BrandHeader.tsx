import avatarUrl from '../assets/brand/kaifanli-avatar-144.png';

type BrandHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  compact?: boolean;
  mascotSrc?: string;
};

export function BrandHeader({ eyebrow = '开饭狸', title, subtitle, compact = false, mascotSrc = avatarUrl }: BrandHeaderProps) {
  return (
    <header className={`brand-header ${compact ? 'brand-header--compact' : ''}`}>
      <img className="brand-header__avatar" src={mascotSrc} alt="" />
      <div>
        <div className="brand-header__eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </header>
  );
}
