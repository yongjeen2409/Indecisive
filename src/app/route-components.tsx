'use client';

import RouteGate from '../components/RouteGate';
import AnalyzingLoader from '../components/AnalyzingLoader';
import { ROUTES, getLatestStaffRoute } from '../lib/routes';
import BlueprintArena from '../views/BlueprintArena';
import ConflictReport from '../views/ConflictReport';
import Dashboard from '../views/Dashboard';
import DeptHeadReview from '../views/DeptHeadReview';
import EscalatedPage from '../views/EscalatedPage';
import LandingPage from '../views/LandingPage';
import LoginPage from '../views/LoginPage';
import MergeView from '../views/MergeView';
import OutputPage from '../views/OutputPage';
import ProblemSubmission from '../views/ProblemSubmission';
import ScoringView from '../views/ScoringView';

function resolveStaffRedirectPath({
  submissionStatus,
  conflictsAcknowledged,
}: {
  submissionStatus: 'draft' | 'analyzing' | 'blueprints' | 'conflicts' | 'scoring' | 'escalated';
  conflictsAcknowledged: boolean;
}) {
  if (submissionStatus === 'scoring' && !conflictsAcknowledged) {
    return ROUTES.conflicts;
  }

  return getLatestStaffRoute(submissionStatus);
}

export function LandingRoute() {
  return (
    <RouteGate mode="public-only">
      <LandingPage />
    </RouteGate>
  );
}

export function LoginRoute() {
  return (
    <RouteGate mode="public-only">
      <LoginPage />
    </RouteGate>
  );
}

export function DashboardRoute() {
  return (
    <RouteGate mode="authenticated">
      <Dashboard />
    </RouteGate>
  );
}

export function SubmitRoute() {
  return (
    <RouteGate
      mode="staff"
      validate={app => (app.submissionStatus === 'draft' ? null : resolveStaffRedirectPath(app))}
    >
      <ProblemSubmission />
    </RouteGate>
  );
}

export function AnalyzingRoute() {
  return (
    <RouteGate
      mode="staff"
      validate={app =>
        app.activeSubmission && app.submissionStatus === 'analyzing'
          ? null
          : resolveStaffRedirectPath(app)
      }
    >
      <AnalyzingLoader />
    </RouteGate>
  );
}

export function BlueprintsRoute() {
  return (
    <RouteGate
      mode="staff"
      validate={app =>
        app.blueprints.length > 0 &&
        ['blueprints', 'conflicts', 'scoring'].includes(app.submissionStatus)
          ? null
          : resolveStaffRedirectPath(app)
      }
    >
      <BlueprintArena />
    </RouteGate>
  );
}

export function ConflictsRoute() {
  return (
    <RouteGate
      mode="staff"
      validate={app =>
        app.blueprints.length > 0 && ['conflicts', 'scoring'].includes(app.submissionStatus)
          ? null
          : app.blueprints.length > 0
            ? ROUTES.blueprints
            : resolveStaffRedirectPath(app)
      }
    >
      <ConflictReport />
    </RouteGate>
  );
}

export function ScoringRoute() {
  return (
    <RouteGate
      mode="staff"
      validate={app =>
        app.blueprints.length > 0 &&
        app.conflictsAcknowledged &&
        app.submissionStatus === 'scoring'
          ? null
          : app.blueprints.length > 0
            ? ROUTES.conflicts
            : resolveStaffRedirectPath(app)
      }
    >
      <ScoringView />
    </RouteGate>
  );
}

export function EscalatedRoute() {
  return (
    <RouteGate
      mode="staff"
      validate={app =>
        app.submissionStatus === 'escalated' ? null : resolveStaffRedirectPath(app)
      }
    >
      <EscalatedPage />
    </RouteGate>
  );
}

export function ReviewRoute() {
  return (
    <RouteGate mode="dept_head">
      <DeptHeadReview />
    </RouteGate>
  );
}

export function MergeRoute() {
  return (
    <RouteGate mode="director">
      <MergeView />
    </RouteGate>
  );
}

export function OutputRoute() {
  return (
    <RouteGate mode="director" validate={app => (app.mergedStrategy ? null : ROUTES.merge)}>
      <OutputPage />
    </RouteGate>
  );
}
