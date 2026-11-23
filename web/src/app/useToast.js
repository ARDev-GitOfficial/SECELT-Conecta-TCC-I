import { useCallback, useEffect, useRef, useState } from 'react';

export function useToast() {
  const [message, setMessage] = useState('');
  const timer = useRef();

  const notify = useCallback(next => {
    clearTimeout(timer.current);
    setMessage(next);
    timer.current = setTimeout(() => setMessage(''), 2800);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  return [message, notify];
}
