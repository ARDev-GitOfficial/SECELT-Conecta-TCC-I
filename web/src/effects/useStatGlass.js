import { useEffect, useRef } from 'react';
import { LiquidGlass } from '@ybouane/liquidglass';
import { attachLiquidTargets } from './liquidTargets.js';

export function useStatGlass() {
  const container = useRef(null);
  useEffect(
    () => {
      const root = container.current;
      if (!root) return;
      const glassElements = [...root.children].filter(element => element.matches('.stat-card'));
      if (!glassElements.length) return;

      let cancelled = false;
      let instance;
      LiquidGlass.init({ root, glassElements }).then(glass => {
        if (cancelled) glass.destroy();
        else instance = glass;
      }).catch(error => {
        if (cancelled) return;
        glassElements.forEach(element => element.classList.add('liquid-fallback'));
        console.warn('Efeito Liquid Glass indisponível.', error);
      });

      return () => {
        cancelled = true;
        instance?.destroy();
      };
    },
    []
  );
  useEffect(() => attachLiquidTargets(container.current), []);
  return container;
}
