'use client';

import { useContext, useEffect, type ReactNode } from 'react';
import { UserLabelContext } from './workspace-chrome';

type Domain = 'central' | 'commercial' | 'contracts' | 'operations' | 'inventory' | 'risk' | 'financial' | 'fiscal';

// Pages retain their server-side authentication and data loading. The shared
// chrome lives in the root layout and does not remount between page changes.
export function AppShell({ userLabel, children }: {
  activeDomain: Domain;
  userLabel: string;
  children: ReactNode;
}) {
  const setUserLabel = useContext(UserLabelContext);

  useEffect(() => { setUserLabel?.(userLabel); }, [setUserLabel, userLabel]);

  return <>{children}</>;
}
