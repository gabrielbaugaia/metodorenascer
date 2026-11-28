/** Browser preview addresses require editor login; Node uses the draft's public local endpoint instead. */
export function sitemapPublicConfig(environment: Record<string, string | undefined>) {
  const browserUrl = environment.VITE_SUPABASE_URL;
  const draftPreview = browserUrl && new URL(browserUrl).pathname.includes('/_port_8001');
  const url = draftPreview ? environment.SUPABASE_URL : browserUrl;
  const key = draftPreview ? environment.SUPABASE_PUBLISHABLE_KEY || environment.SUPABASE_ANON_KEY : environment.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Missing public configuration for sitemap generation.');
  return { url, key };
}