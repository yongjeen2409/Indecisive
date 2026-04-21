import { Role, SubmissionStatus } from '../types';

export const ROUTES = {
  landing: '/',
  login: '/login',
  dashboard: '/dashboard',
  submit: '/submit',
  analyzing: '/analyzing',
  blueprints: '/blueprints',
  conflicts: '/conflicts',
  scoring: '/scoring',
  escalated: '/escalated',
  merge: '/merge',
  output: '/output',
} as const;

export function isSuperior(role: Role | null | undefined) {
  return role === 'lead' || role === 'director' || role === 'executive';
}

export function getLatestStaffRoute(status: SubmissionStatus) {
  switch (status) {
    case 'analyzing':
      return ROUTES.analyzing;
    case 'blueprints':
      return ROUTES.blueprints;
    case 'conflicts':
      return ROUTES.conflicts;
    case 'scoring':
      return ROUTES.scoring;
    case 'escalated':
      return ROUTES.escalated;
    case 'draft':
    default:
      return ROUTES.submit;
  }
}
