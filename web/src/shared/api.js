export async function api(path, { token, body, ...options } = {}) {
  const response = await fetch(
    '/api' + path,
    {
      ...options,
      headers: { ...options.headers, ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'Não foi possível concluir. Tente novamente.'), {status: response.status});
  return data;
}
