export const fmtDate = (v, opts = { day: '2-digit', month: 'short' }) => v ? new Intl.DateTimeFormat('pt-BR', opts).format(new Date(v)) : '';
export const fmtDateTime = v => v
  ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(v))
  : '';
export function dayKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const part = t => parts.find(p => p.type === t)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
