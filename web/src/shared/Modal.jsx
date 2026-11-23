import { useEffect } from 'react';
import { SocialDialog } from './Dialog.jsx';

export function Modal({ children, onClose }) {
  useEffect(
    () => {
      const h = () => onClose();
      document.addEventListener('close-dialog', h);
      return () => document.removeEventListener('close-dialog', h);
    },
    [onClose]
  );
  return <SocialDialog title="SECELT Conecta" onClose={onClose}>{children}</SocialDialog>;
}
