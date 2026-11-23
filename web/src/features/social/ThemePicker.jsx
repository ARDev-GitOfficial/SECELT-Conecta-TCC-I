import { Check } from 'lucide-react';
import { useCommunity } from './community.jsx';

export function ThemePicker({ compact = false }) {
  const { state, setState } = useCommunity();
  return <div className={`sg-theme-picker ${compact ? 'compact' : ''}`} role="group" aria-label="Tema da aparência">
    {[['blue', 'Azul'], ['black', 'Preto']].map(([theme, name]) => <button
      key={theme}
      className={`${theme} ${state.theme === theme ? 'selected' : ''}`}
      aria-pressed={state.theme === theme}
      onClick={() => setState(s => ({ ...s, theme }))}
    >
      <span className="sg-theme-swatch" />
      {!compact && <span>{name}</span>}
      {state.theme === theme && <Check size={14} />}
      <span className="sg-sr-only">{compact ? `Tema ${name}` : ''}</span>
    </button>)}
  </div>;
}
