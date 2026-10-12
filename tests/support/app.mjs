// Starts the built app (`next start`) against the fake Supabase with test-only
// configuration. Every variable from .env.example is set explicitly, so values
// from a developer's .env.local (real keys) can never be used by the tests.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

export function testEnv(fakeUrl, overrides = {}) {
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_PUBLIC_SUPABASE_URL: fakeUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    OPENAI_API_KEY: 'test-openai-key',
    OPENAI_BASE_URL: `${fakeUrl}/openai/v1`,
    PHYGO_ADMIN_EMAILS: 'admin@test.invalid',
    CRON_SECRET: 'test-cron-secret',
    PHYGO_ADMIN_API_TOKEN: 'test-admin-token',
    DAILY_API_KEY: '',
    SOFFICE_PATH: '',
    EBOOK_CONVERT_PATH: '',
    ...overrides,
  };
}

export async function startApp({ fakeUrl, port = 3411, serviceRoleKey, env = {} }) {
  const overrides = { ...env };
  if (serviceRoleKey !== undefined) overrides.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
  let output = '';
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
    cwd: ROOT,
    env: testEnv(fakeUrl, overrides),
  });
  child.stdout.on('data', (d) => (output += d));
  child.stderr.on('data', (d) => (output += d));
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 120; i++) {
    try {
      await fetch(`${url}/robots.txt`);
      break;
    } catch {
      if (child.exitCode !== null) throw new Error(`next start exited:\n${output}`);
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return {
    url,
    logs: () => output,
    stop: () =>
      new Promise((resolve) => {
        if (child.exitCode !== null) return resolve();
        child.on('exit', resolve);
        child.kill('SIGTERM');
      }),
  };
}
