export const send = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
};
export async function body(req, limit = 1e6) {
  let s = '';
  for await (const c of req) {
    s += c;
    if (s.length > limit) throw Error('Payload too large');
  }
  return s ? JSON.parse(s) : {};
}
