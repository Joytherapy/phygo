// Checks the server-side Supabase configuration without ever printing it.
//
// A service-role key copied from a dashboard while it was masked contains "•"
// characters. supabase-js then fails before any request is sent ("Cannot
// convert argument to a ByteString ... value of 8226"), so nothing reaches the
// Supabase logs and the feature just looks broken. Naming the problem lets the
// server log say exactly which variable to fix.

/** JWT keys and sb_secret_/sb_publishable_ keys only ever contain printable ASCII without spaces. */
const KEY_SHAPE = /^[\x21-\x7e]+$/;

export function serviceRoleConfigProblem(env: NodeJS.ProcessEnv = process.env): string | null {
  if (!env.NEXT_PUBLIC_SUPABASE_URL) return 'NEXT_PUBLIC_SUPABASE_URL is not set';
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return 'SUPABASE_SERVICE_ROLE_KEY is not set';
  if (!KEY_SHAPE.test(key)) {
    return key.includes('•')
      ? 'SUPABASE_SERVICE_ROLE_KEY contains "•" characters: it was probably copied while masked; copy it again with the copy button'
      : 'SUPABASE_SERVICE_ROLE_KEY contains spaces or non-ASCII characters';
  }
  return null;
}
