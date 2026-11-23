export const CATEGORIES = ['Comunidade', 'Cultura', 'Esporte', 'Turismo', 'Lazer', 'Calendário'];
export const PARTNER_ROLE = 'Parceiro autorizado';
export const editable = ['Rascunho', 'Reprovado'];
export const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
export const clean = (value, max = 5000) => String(value ?? '').trim().slice(0, max);
export const safeLink = value => {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (['http:', 'https:'].includes(url.protocol)) return url.href;
  } catch { }
  fail('Informe um link HTTP ou HTTPS válido.');
};
