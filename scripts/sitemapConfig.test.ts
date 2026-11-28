import { expect, test } from 'bun:test';
import { sitemapPublicConfig } from './sitemapConfig';

test('draft sitemap uses local public credentials, never a service key', () => {
  expect(sitemapPublicConfig({ VITE_SUPABASE_URL: 'https://preview.example.com/_port_8001', VITE_SUPABASE_PUBLISHABLE_KEY: 'browser-public', SUPABASE_URL: 'http://127.0.0.1:8001', SUPABASE_PUBLISHABLE_KEY: 'draft-public', SUPABASE_SERVICE_ROLE_KEY: 'must-not-use' })).toEqual({ url: 'http://127.0.0.1:8001', key: 'draft-public' });
});
test('production sitemap keeps the configured public endpoint', () => {
  expect(sitemapPublicConfig({ VITE_SUPABASE_URL: 'https://public.example.com', VITE_SUPABASE_PUBLISHABLE_KEY: 'public-key', SUPABASE_URL: 'http://127.0.0.1:8001', SUPABASE_PUBLISHABLE_KEY: 'draft-public' })).toEqual({ url: 'https://public.example.com', key: 'public-key' });
});
test('draft fails without public credentials instead of using service credentials', () => {
  expect(() => sitemapPublicConfig({ VITE_SUPABASE_URL: 'https://preview.example.com/_port_8001', SUPABASE_URL: 'http://127.0.0.1:8001', SUPABASE_SERVICE_ROLE_KEY: 'must-not-use' })).toThrow();
});