import { createBrowserClient } from '@supabase/ssr';
import { supabaseConfiguration } from './configuration';

export function createClient() {
  const configuration = supabaseConfiguration();
  return createBrowserClient(configuration.url, configuration.publishableKey);
}
