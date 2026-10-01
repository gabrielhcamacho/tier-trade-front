import { redirect } from 'next/navigation';
import { hasSupabaseConfiguration } from './supabase/configuration';
import { createClient } from './supabase/server';

export type CurrentUserContext = {
  userLabel: string;
  identityHeaders: Record<string, string>;
};

export async function currentUserContext(): Promise<CurrentUserContext> {
  if (hasSupabaseConfiguration()) {
    const supabase = await createClient();
    const [{ data: claimsData, error }, { data: sessionData }] = await Promise.all([
      supabase.auth.getClaims(),
      supabase.auth.getSession(),
    ]);
    if (error || !claimsData?.claims.sub || !sessionData.session?.access_token) redirect('/login');
    return {
      userLabel: typeof claimsData.claims.email === 'string' ? claimsData.claims.email : 'Usuário autenticado',
      identityHeaders: { authorization: `Bearer ${sessionData.session.access_token}` },
    };
  }

  const tenantId = process.env.NEXT_PUBLIC_DEV_TENANT_ID;
  const actorId = process.env.NEXT_PUBLIC_DEV_ACTOR_ID;
  return {
    userLabel: 'Identidade local',
    identityHeaders: tenantId && actorId
      ? { 'x-tenant-id': tenantId, 'x-actor-id': actorId }
      : {},
  };
}
