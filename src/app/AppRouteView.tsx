'use client';

import { usePathname } from 'next/navigation';
import {
  AnalyzingRoute,
  BlueprintsRoute,
  ConflictsRoute,
  DashboardRoute,
  EscalatedRoute,
  LandingRoute,
  LoginRoute,
  MergeRoute,
  OutputRoute,
  ScoringRoute,
  SubmitRoute,
} from './route-components';
import { ROUTES } from '../lib/routes';

export default function AppRouteView() {
  const pathname = usePathname();

  switch (pathname) {
    case ROUTES.landing:
      return <LandingRoute />;
    case ROUTES.login:
      return <LoginRoute />;
    case ROUTES.dashboard:
      return <DashboardRoute />;
    case ROUTES.submit:
      return <SubmitRoute />;
    case ROUTES.analyzing:
      return <AnalyzingRoute />;
    case ROUTES.blueprints:
      return <BlueprintsRoute />;
    case ROUTES.conflicts:
      return <ConflictsRoute />;
    case ROUTES.scoring:
      return <ScoringRoute />;
    case ROUTES.escalated:
      return <EscalatedRoute />;
    case ROUTES.merge:
      return <MergeRoute />;
    case ROUTES.output:
      return <OutputRoute />;
    default:
      return <LandingRoute />;
  }
}
