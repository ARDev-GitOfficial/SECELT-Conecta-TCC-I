import { LiquidGlass } from '@ybouane/liquidglass';
import { useEffect, useRef } from 'react';
import { NavItems } from './navigation.jsx';

const glassConfig = JSON.stringify({
  blurAmount: .22,
  refraction: 1.45,
  chromAberration: 0,
  edgeHighlight: .7,
  specular: .48,
  fresnel: 1.12,
  distortion: .018,
  cornerRadius: 23,
  zRadius: 16,
  opacity: .32,
  saturation: .04,
  tintStrength: .025,
  shadowOpacity: .15,
  button: true
});

export function MobileNavigation({ route, navigate, theme }) {
  const frame = useRef(null);
  const dock = useRef(null);

  useEffect(() => {
    const viewport = matchMedia('(max-width: 760px)');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let generation = 0;
    let glass;

    const update = async () => {
      const id = ++generation;
      glass?.destroy();
      glass = undefined;
      if (!viewport.matches || reducedMotion.matches || !frame.current || !dock.current) return;

      try {
        const next = await LiquidGlass.init({ root: frame.current, glassElements: [dock.current] });
        if (id === generation) glass = next;
        else next.destroy();
      } catch {}
    };

    update();
    viewport.addEventListener('change', update);
    reducedMotion.addEventListener('change', update);
    return () => {
      generation++;
      glass?.destroy();
      viewport.removeEventListener('change', update);
      reducedMotion.removeEventListener('change', update);
    };
  }, [theme]);

  return <div className="sg-mobile-nav-frame" ref={frame}>
    <nav ref={dock} className="sg-mobile-nav sg-glass" data-config={glassConfig} aria-label="Seções principais">
      <NavItems route={route} navigate={navigate} mobile />
    </nav>
  </div>;
}
