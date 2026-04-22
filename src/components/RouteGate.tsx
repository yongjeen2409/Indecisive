'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ROUTES, isDeptHead, isDirector, isSuperior } from '../lib/routes';

type AccessMode = 'public-only' | 'authenticated' | 'staff' | 'dept_head' | 'director' | 'superior';

export default function RouteGate({
  mode,
  validate,
  children,
}: {
  mode: AccessMode;
  validate?: (app: ReturnType<typeof useApp>) => string | null;
  children: ReactNode;
}) {
  const app = useApp();
  const router = useRouter();
  const pathname = usePathname();

  let redirect: string | null = null;

  if (mode === 'public-only') {
    redirect = app.currentUser ? ROUTES.dashboard : null;
  } else if (mode === 'authenticated') {
    redirect = app.currentUser ? null : ROUTES.login;
  } else if (mode === 'staff') {
    if (!app.currentUser) {
      redirect = ROUTES.login;
    } else if (app.currentUser.role !== 'staff') {
      redirect = ROUTES.dashboard;
    } else {
      redirect = validate?.(app) ?? null;
    }
  } else if (mode === 'dept_head') {
    if (!app.currentUser) {
      redirect = ROUTES.login;
    } else if (!isDeptHead(app.currentUser.role)) {
      redirect = ROUTES.dashboard;
    } else {
      redirect = validate?.(app) ?? null;
    }
  } else if (mode === 'director') {
    if (!app.currentUser) {
      redirect = ROUTES.login;
    } else if (!isDirector(app.currentUser.role)) {
      redirect = ROUTES.dashboard;
    } else {
      redirect = validate?.(app) ?? null;
    }
  } else if (mode === 'superior') {
    if (!app.currentUser) {
      redirect = ROUTES.login;
    } else if (!isSuperior(app.currentUser.role)) {
      redirect = ROUTES.dashboard;
    } else {
      redirect = validate?.(app) ?? null;
    }
  }

  useEffect(() => {
    if (redirect && redirect !== pathname) {
      router.replace(redirect);
    }
  }, [pathname, redirect, router]);

  if (redirect && redirect !== pathname) {
    return null;
  }

  return <>{children}</>;
}
