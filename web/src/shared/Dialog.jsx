import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const dialogStack = [];
let originalOverflow = '';
export function SocialDialog({ title, onClose, children, className = '' }) {
  const ref = useRef(null), closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(
    () => {
      const previous = document.activeElement;
      if (!dialogStack.length) originalOverflow = document.body.style.overflow;
      dialogStack.push(ref);
      document.body.style.overflow = 'hidden';
      const frame = requestAnimationFrame(() => ref.current?.querySelector('button,input,select,textarea,[tabindex="0"]')?.focus());
      const handler = e => {
        if (dialogStack.at(-1) !== ref) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          closeRef.current?.();
        }
        if (e.key === 'Tab') {
          const elements = [
            ...ref.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]')
          ].filter(el => el.getClientRects().length);
          const first = elements[0], last = elements.at(-1);
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
          else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      };
      document.addEventListener('keydown', handler);
      return () => {
        cancelAnimationFrame(frame);
        const index = dialogStack.indexOf(ref);
        if (index >= 0) dialogStack.splice(index, 1);
        if (!dialogStack.length) document.body.style.overflow = originalOverflow;
        document.removeEventListener('keydown', handler);
        if (previous?.isConnected) previous.focus();
      };
    },
    []
  );
  return createPortal(
    <div className="sg-dialog-scrim" onMouseDown={e => e.target === e.currentTarget && onClose?.()}>
      <section
        ref={ref}
        className={`sg-dialog sg-glass ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button className="sg-icon-button sg-dialog-close" aria-label="Fechar janela" onClick={onClose}>
          <X size={22} />
        </button>
        {children}
      </section>
    </div>,
    document.body
  );
}
