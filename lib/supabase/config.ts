export const SUPABASE_REQUEST_TIMEOUT_MS = 8_000;

export function getPublicSupabaseConfig() {
  // Keep these accesses explicit so Next.js can inline public browser values.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }

  return { url, key };
}
