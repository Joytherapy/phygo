// A small stand-in for Supabase (auth, PostgREST, storage) and OpenAI, used by
// the integration tests in tests/. It serves only synthetic data, never talks
// to the network and records every request, so tests can prove what the app
// asked for (and that it did not call OpenAI or any real service).
//
//   import { startFakeSupabase } from './support/fake-supabase.mjs';
//   const fake = await startFakeSupabase({ port: 54329, tables, users });
//
// Supported PostgREST features: select (columns ignored), eq., neq., is.null,
// in.(...), order=<col>.asc|desc, offset/limit, single/maybeSingle (Accept
// header), insert/update/upsert/delete on simple tables, and primary-key
// conflicts (23505) for the tables listed in `primaryKeys`.
import http from 'node:http';

export async function startFakeSupabase({ port, tables = {}, users = {}, primaryKeys = { ask_phygo_usage: 'ip' } }) {
  const state = {
    tables: structuredClone(tables),
    users, // access token -> user object
    requests: [],
    failTables: new Set(), // tables that answer 500 (to test error handling)
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const body = await new Promise((resolve) => {
      let b = '';
      req.on('data', (c) => (b += c));
      req.on('end', () => resolve(b));
    });
    state.requests.push({ method: req.method, path: url.pathname, search: url.search, auth: req.headers.authorization ?? null });
    // Browser pages (Playwright checks) call Supabase directly from another origin.
    const cors = {
      'access-control-allow-origin': req.headers.origin ?? '*',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': req.headers['access-control-request-headers'] ?? '*',
      'access-control-allow-methods': 'GET,HEAD,POST,PATCH,DELETE,OPTIONS',
    };
    const send = (status, payload, headers = {}) => {
      res.writeHead(status, { 'content-type': 'application/json', ...cors, ...headers });
      res.end(payload === undefined ? '' : JSON.stringify(payload));
    };
    if (req.method === 'OPTIONS') {
      res.writeHead(204, cors);
      return res.end();
    }

    // Test control: make a table fail, or reset failures.
    if (url.pathname === '/__control/fail') {
      const t = url.searchParams.get('table');
      if (t) state.failTables.add(t);
      else state.failTables.clear();
      return send(200, { ok: true });
    }

    // Auth: the token in "Authorization: Bearer <token>" identifies the user.
    if (url.pathname === '/auth/v1/user') {
      const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
      const user = state.users[token];
      return user ? send(200, user) : send(401, { code: 401, msg: 'invalid JWT' });
    }
    if (url.pathname.startsWith('/auth/v1/')) return send(401, { msg: 'not supported in tests' });

    // Storage: signed URLs for private buckets.
    const sign = url.pathname.match(/^\/storage\/v1\/object\/sign\/([^/]+)$/);
    if (sign && req.method === 'POST') {
      const { paths = [] } = JSON.parse(body || '{}');
      return send(
        200,
        paths.map((p) => ({ path: p, signedURL: `/object/sign/${sign[1]}/${p}?token=test`, error: null })),
      );
    }

    // OpenAI stand-in: any call is recorded and refused, so tests can assert none happened.
    if (url.pathname.startsWith('/openai/')) return send(500, { error: { message: 'OpenAI is not available in tests' } });

    const rest = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/);
    if (!rest) return send(404, { message: 'not found' });
    const table = rest[1];
    if (state.failTables.has(table)) return send(500, { message: `simulated failure on ${table}`, code: 'XX000' });
    const rows = (state.tables[table] ??= []);

    const filters = [];
    for (const [key, raw] of url.searchParams) {
      if (['select', 'order', 'offset', 'limit', 'on_conflict', 'columns'].includes(key)) continue;
      filters.push([key, raw]);
    }
    const match = (row) =>
      filters.every(([k, raw]) => {
        const v = row[k];
        if (raw === 'is.null') return v === null || v === undefined;
        if (raw.startsWith('eq.')) return String(v) === raw.slice(3);
        if (raw.startsWith('neq.')) return String(v) !== raw.slice(4);
        if (raw.startsWith('in.(')) return raw.slice(4, -1).split(',').map((s) => s.replace(/^"|"$/g, '')).includes(String(v));
        return true;
      });

    if (req.method === 'GET' || req.method === 'HEAD') {
      let out = rows.filter(match);
      const order = url.searchParams.get('order');
      if (order) {
        const [col, dir] = order.split('.');
        out = [...out].sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (dir === 'desc' ? -1 : 1));
      }
      const offset = Number(url.searchParams.get('offset') ?? 0);
      const limit = url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : 1000; // PostgREST max-rows
      out = out.slice(offset, offset + Math.min(limit, 1000));
      if ((req.headers.accept ?? '').includes('vnd.pgrst.object')) {
        if (out.length !== 1) return send(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' });
        return send(200, out[0]);
      }
      return send(200, out);
    }
    if (req.method === 'POST') {
      const items = [].concat(JSON.parse(body || '[]'));
      const pk = primaryKeys[table];
      if (pk && !url.searchParams.get('on_conflict') && items.some((item) => rows.some((r) => r[pk] === item[pk]))) {
        return send(409, { code: '23505', message: `duplicate key value violates unique constraint "${table}_pkey"` });
      }
      for (const item of items) {
        const conflict = url.searchParams.get('on_conflict');
        const existing = conflict ? rows.find((r) => conflict.split(',').every((c) => r[c] === item[c])) : null;
        if (existing) Object.assign(existing, item);
        else rows.push({ id: item.id ?? `row-${rows.length + 1}`, ...item });
      }
      return send(201, items);
    }
    if (req.method === 'PATCH') {
      const patch = JSON.parse(body || '{}');
      const hit = rows.filter(match);
      hit.forEach((r) => Object.assign(r, patch));
      if ((req.headers.accept ?? '').includes('vnd.pgrst.object')) {
        if (hit.length !== 1) return send(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' });
        return send(200, hit[0]);
      }
      return send(200, hit);
    }
    if (req.method === 'DELETE') {
      state.tables[table] = rows.filter((r) => !match(r));
      return send(204);
    }
    return send(405, { message: 'method not allowed' });
  });

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  return {
    state,
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/** Cookie that @supabase/ssr reads as a logged-in session for the fake project at 127.0.0.1. */
export function sessionCookie(token, user) {
  const session = {
    access_token: token,
    refresh_token: `refresh-${token}`,
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    user,
  };
  return `sb-127-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`;
}
