import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type SheetProps = {
  title: string;
  open: boolean;
  children: ReactNode;
  onClose: () => void;
};

export function Sheet({ title, open, children, onClose }: SheetProps) {
  if (!open) return null;
  return (
    <div className="sheet-layer" role="presentation">
      <button className="sheet-layer__backdrop" type="button" aria-label="关闭" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__head">
          <h2>{title}</h2>
          <button className="round-icon" type="button" aria-label="关闭" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
