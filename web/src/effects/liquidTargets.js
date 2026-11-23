export function attachLiquidTargets(root) {
  const targets = [...root.querySelectorAll('.liquid-target')];
  const states = new window.Map();
  const baseConfigs = new WeakMap();
  const filters = new WeakMap();
  const svgNS = 'http://www.w3.org/2000/svg';
  const filterHost = document.createElementNS(svgNS, 'svg');
  filterHost.setAttribute('aria-hidden', 'true');
  Object.assign(filterHost.style, { position: 'fixed', width: '0', height: '0', overflow: 'hidden', pointerEvents: 'none' });
  document.body.appendChild(filterHost);
  let filterId = 0;
  const timer = (state, key, callback, delay) => {
    clearTimeout(state[key]);
    state[key] = window.setTimeout(() => {
      state[key] = 0;
      callback();
    }, delay);
  };
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const edgePoint = () => {
    const edge = Math.floor(Math.random() * 4), along = randomBetween(.16, .84);
    if (edge === 0) return { x: along, y: .08, angle: 0 };
    if (edge === 1) return { x: .92, y: along, angle: 90 };
    if (edge === 2) return { x: along, y: .92, angle: 0 };
    return { x: .08, y: along, angle: 90 };
  };
  const setLightPosition = (el, state, x, y, angle = state.angle) => {
    state.lightX = Math.max(.06, Math.min(.94, x));
    state.lightY = Math.max(.06, Math.min(.94, y));
    state.angle = angle;
    el.style.setProperty('--glass-light-x', `${(state.lightX * 100).toFixed(1)}%`);
    el.style.setProperty('--glass-light-y', `${(state.lightY * 100).toFixed(1)}%`);
    el.style.setProperty('--glass-light-rx', state.angle === 90 ? '14%' : '24%');
    el.style.setProperty('--glass-light-ry', state.angle === 90 ? '24%' : '14%');
  };
  const scheduleLight = (el, state, delay = randomBetween(8000, 12000)) => timer(
    state,
    'ambientTimer',
    () => {
      const point = edgePoint(), duration = randomBetween(4000, 6000);
      el.style.setProperty('--glass-glide-duration', `${duration.toFixed(0)}ms`);
      el.classList.add('glass-light-visible');
      setLightPosition(el, state, point.x, point.y, point.angle);
      timer(
        state,
        'ambientEndTimer',
        () => {
          el.classList.remove('glass-light-visible');
          scheduleLight(el, state, randomBetween(8000, 12000));
        },
        duration
      );
    },
    delay
  );
  const ensureWaterFilter = el => {
    let entry = filters.get(el);
    if (entry) return entry;
    const id = `glass-water-${++filterId}`;
    const filter = document.createElementNS(svgNS, 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('x', '-8%');
    filter.setAttribute('y', '-8%');
    filter.setAttribute('width', '116%');
    filter.setAttribute('height', '116%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    const turbulence = document.createElementNS(svgNS, 'feTurbulence');
    turbulence.setAttribute('type', 'fractalNoise');
    turbulence.setAttribute('baseFrequency', '.008 .018');
    turbulence.setAttribute('numOctaves', '1');
    turbulence.setAttribute('seed', String(2 + filterId));
    turbulence.setAttribute('result', 'water-noise');
    const frequencyMotion = document.createElementNS(svgNS, 'animate');
    frequencyMotion.setAttribute('attributeName', 'baseFrequency');
    frequencyMotion.setAttribute('values', '.008 .018;.034 .052;.008 .018');
    frequencyMotion.setAttribute('keyTimes', '0;.42;1');
    frequencyMotion.setAttribute('dur', '1000ms');
    frequencyMotion.setAttribute('begin', 'indefinite');
    frequencyMotion.setAttribute('fill', 'freeze');
    turbulence.appendChild(frequencyMotion);
    const displacement = document.createElementNS(svgNS, 'feDisplacementMap');
    displacement.setAttribute('in', 'SourceGraphic');
    displacement.setAttribute('in2', 'water-noise');
    displacement.setAttribute('scale', '0');
    displacement.setAttribute('xChannelSelector', 'R');
    displacement.setAttribute('yChannelSelector', 'G');
    const scaleMotion = document.createElementNS(svgNS, 'animate');
    scaleMotion.setAttribute('attributeName', 'scale');
    scaleMotion.setAttribute('values', '0;10;0');
    scaleMotion.setAttribute('keyTimes', '0;.42;1');
    scaleMotion.setAttribute('dur', '1000ms');
    scaleMotion.setAttribute('begin', 'indefinite');
    scaleMotion.setAttribute('fill', 'freeze');
    displacement.appendChild(scaleMotion);
    filter.append(turbulence, displacement);
    filterHost.appendChild(filter);
    entry = { id, animations: [frequencyMotion, scaleMotion] };
    filters.set(el, entry);
    return entry;
  };
  const animateWaterFilter = el => {
    const entry = ensureWaterFilter(el);
    el.style.filter = `url(#${entry.id})`;
    entry.animations.forEach(animation => { try { animation.beginElement(); } catch { } });
  };
  const boostLens = (el, state, strength) => {
    const base = baseConfigs.get(el);
    if (!base) return;
    el.dataset.config = JSON.stringify({
      ...base,
      refraction: Math.min(1.78, (base.refraction || 1.3) + .24 * strength),
      distortion: Math.min(.105, (base.distortion || 0) + .045 * strength),
      edgeHighlight: Math.min(.96, (base.edgeHighlight || .6) + .12 * strength),
      chromAberration: 0
    });
    timer(state, 'lensTimer', () => { el.dataset.config = JSON.stringify(base); }, 1000);
  };
  const contact = (el, clientX, clientY) => {
    const state = states.get(el), rect = el.getBoundingClientRect();
    if (!state) return;
    clearTimeout(state.ambientTimer);
    clearTimeout(state.ambientEndTimer);
    clearTimeout(state.glintTimer);
    state.ambientTimer = state.ambientEndTimer = state.glintTimer = 0;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    el.style.setProperty('--touch-x', `${x}px`);
    el.style.setProperty('--touch-y', `${y}px`);
    el.style.setProperty('--wave-diameter', `${Math.ceil(Math.hypot(rect.width, rect.height) * 1.65)}px`);
    el.style.setProperty('--water-strength', '.42');
    el.style.setProperty('--glass-glide-duration', '420ms');
    setLightPosition(el, state, x / Math.max(rect.width, 1), y / Math.max(rect.height, 1), state.angle);
    el.classList.add('glass-light-visible', 'glass-light-contact');
    el.classList.remove('glass-ripple');
    void el.offsetWidth;
    el.classList.add('glass-ripple');
    animateWaterFilter(el);
    boostLens(el, state, .6);
    timer(state, 'rippleTimer', () => {
      el.classList.remove('glass-ripple');
      el.style.filter = state.inlineFilter;
    }, 1040);
  };
  const move = e => {
    const el = e.currentTarget, state = states.get(el);
    if (!state) return;
    const pressed = e.buttons > 0 || (e.pointerType === 'touch' && e.pressure > 0);
    if (pressed && state.pointerId === e.pointerId && state.lastPoint) {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--glass-glide-duration', '160ms');
      setLightPosition(el, state, (e.clientX - rect.left) / Math.max(rect.width, 1), (e.clientY - rect.top) / Math.max(rect.height, 1), state.angle);
    }
    if (state.pointerId === e.pointerId) state.lastPoint = { x: e.clientX, y: e.clientY };
  };
  const press = e => {
    if (e.isPrimary === false) return;
    const el = e.currentTarget, state = states.get(el);
    if (!state) return;
    state.pointerId = e.pointerId;
    state.lastPoint = { x: e.clientX, y: e.clientY };
    contact(el, e.clientX, e.clientY);
  };
  const release = e => targets.forEach(el => {
    const state = states.get(el);
    if (!state || state.pointerId !== e.pointerId) return;
    state.lastPoint = null;
    state.pointerId = null;
    timer(
      state,
      'glintTimer',
      () => {
        el.classList.remove('glass-light-visible', 'glass-light-contact');
        scheduleLight(el, state, randomBetween(8000, 12000));
      },
      600
    );
  });
  targets.forEach(el => {
    let config = {};
    try { config = JSON.parse(el.dataset.config || '{}'); } catch { }
    baseConfigs.set(el, config);
    const point = edgePoint(),
      state = { lightX: point.x, lightY: point.y, angle: point.angle, lastPoint: null, inlineFilter: el.style.filter };
    states.set(el, state);
    setLightPosition(el, state, point.x, point.y, point.angle);
    scheduleLight(el, state, randomBetween(1800, 5000));
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerdown', press, { passive: true });
  });
  window.addEventListener('pointerup', release, { passive: true });
  window.addEventListener('pointercancel', release, { passive: true });
  return () => {
    targets.forEach(el => {
      const state = states.get(el);
      if (state) ['ambientTimer', 'ambientEndTimer', 'glintTimer', 'rippleTimer', 'lensTimer'].forEach(key => clearTimeout(state[key]));
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerdown', press);
      el.classList.remove('glass-light-visible', 'glass-light-contact', 'glass-ripple');
      el.style.filter = state.inlineFilter;
      [
        '--glass-light-x',
        '--glass-light-y',
        '--glass-light-rx',
        '--glass-light-ry',
        '--glass-glide-duration',
        '--touch-x',
        '--touch-y',
        '--wave-diameter',
        '--water-strength'
      ].forEach(name => el.style.removeProperty(name));
      const base = baseConfigs.get(el);
      if (base) el.dataset.config = JSON.stringify(base);
    });
    window.removeEventListener('pointerup', release);
    window.removeEventListener('pointercancel', release);
    filterHost.remove();
  };
}
