export function StatusTag({ status }) {
  const c = status === 'Publicado'
    ? 'published-tag'
    : status === 'Aguardando Aprovação'
      ? 'pending-tag'
      : ['Reprovado'].includes(status)
        ? 'rejected-tag'
        : ['Encerrado', 'Cancelado', 'Arquivado'].includes(status) ? 'closed-tag' : 'draft-tag';
  return <span className={c}>{status}</span>;
}
