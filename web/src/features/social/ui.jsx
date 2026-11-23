import { BadgeCheck, ShieldCheck } from 'lucide-react';

export const shortNumber = n => new Intl.NumberFormat('pt-BR', { notation: n >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);
export function relativeTime(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (!Number.isFinite(minutes)) return '';
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)} d`;
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(new Date(value));
}
export function Avatar({ name = '', page, size = '', className = '' }) {
  const initials = name.split(' ').filter(Boolean).map(s => s[0]).slice(0, 2).join('');
  return <span
    className={`sg-avatar ${size ? 'sg-avatar-' + size : ''} ${className}`}
    style={page?.color ? { '--avatar-color': page.color } : undefined}
    aria-hidden="true"
  >
    {page?.id === 'secelt' ? <img src="/assets/brand.svg" alt="" /> : initials}
  </span>;
}
export function PageBadge({ page }) {
  return page?.kind === 'official'
    ? <BadgeCheck className="sg-official-badge" size={16} aria-label="Página oficial" />
    : <ShieldCheck className="sg-partner-badge" size={14} aria-label="Parceiro autorizado" />;
}
export function PhotoCredit({ media, compact = false, linked = true }) {
  if (!media?.author) return null;
  return <small className={`sg-photo-credit ${compact ? 'compact' : ''}`}>
    {linked && media.sourceUrl
      ? <a href={media.sourceUrl} target="_blank" rel="noreferrer">Foto: {media.author}</a>
      : <>Foto: {media.author}</>}
    {media.licenseName && <> · {linked && media.licenseUrl
      ? <a href={media.licenseUrl} target="_blank" rel="noreferrer">{media.licenseName}</a>
      : media.licenseName}
    </>}
  </small>;
}
export function EmptyState({ icon: Icon, title, children, action }) {
  return <div className="sg-empty sg-glass">
    {Icon && <span className="sg-empty-icon"><Icon size={30} /></span>}
    <h2>{title}</h2>
    {children && <p>{children}</p>}
    {action}
  </div>;
}
