export function BrandMark({ className = '' }) {
  return <span className={`brand-symbol ${className}`} aria-hidden="true">
    <svg viewBox="0 0 64 64">
      <path d="M13 35c7-11 14-11 20 0s12 11 19-1" />
      <path className="brand-wave" d="M15 44c5-6 9-6 14 0" />
      <circle cx="48" cy="18" r="3.5" />
    </svg>
  </span>;
}
export function Art({ kind = 'river', className = '' }) {
  return <div
    className={`art ${kind} ${className}`}
    aria-label="Arte gráfica autoral com formas inspiradas na paisagem local"
  >
    <span className="sun" />
    {kind.includes('hero-land') && <span className="water-orb" aria-hidden="true" />}
    <span className="hill h1" />
    <span className="hill h2" />
    <span className="river" />
    <span className="art-label" aria-hidden="true" />
  </div>;
}
