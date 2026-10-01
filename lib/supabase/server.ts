import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfiguration } from './configuration';

export async function createClient() {
  const configuration = supabaseConfiguration();
  const cookieStore = await cookies();
  return createServerClient(configuration.url, configuration.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; proxy.ts performs the refresh.
        }
      },
    },
  });
}
