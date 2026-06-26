import type { ButtonHTMLAttributes } from 'react';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  iconSrc: string;
  label: string;
  variant?: 'ghost' | 'green' | 'warm';
};

export function IconButton({ iconSrc, label, variant = 'ghost', className = '', ...props }: IconButtonProps) {
  const shouldShowIcon = variant !== 'green';

  return (
    <button className={`icon-button icon-button--${variant} ${className}`} type="button" {...props}>
      {shouldShowIcon ? <img src={iconSrc} alt="" /> : null}
      <span>{label}</span>
    </button>
  );
}
