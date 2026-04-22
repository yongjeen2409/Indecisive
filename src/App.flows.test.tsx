import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MOCK_USERS,
  createDefaultAttachments,
  createDemoBlueprints,
  createRetrievedContext,
} from './data/mockData';
import { renderApp } from './test/renderApp';
import { EscalationRecord, Submission, User } from './types';

const STAFF_PROBLEM_STATEMENT =
  'Our legacy monolith is slowing release cycles and creating risk whenever multiple teams need to ship at the same time.';
const SECOND_PROBLEM_STATEMENT =
  'Leadership needs one cross-team decision workflow because operations, engineering, and data are using different approval paths.';

function toSubmittedBy(user: User) {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    department: user.department,
    avatar: user.avatar,
  };
}

function buildSubmission(user: User, id: string, problemStatement: string): Submission {
  return {
    id,
    problemStatement,
    createdAt: '2026-04-21',
    attachments: createDefaultAttachments([`${id}.pdf`]),
    submittedBy: toSubmittedBy(user),
  };
}

function buildEscalationRecord({
  id,
  user,
  problemStatement,
  blueprintIndex,
}: {
  id: string;
  user: User;
  problemStatement: string;
  blueprintIndex: number;
}): EscalationRecord {
  const submission = buildSubmission(user, `submission-${id}`, problemStatement);
  const blueprint = createDemoBlueprints(problemStatement)[blueprintIndex];

  return {
    id,
    submission,
    blueprint,
    submittedBy: submission.submittedBy,
    escalatedAt: '2026-04-21',
    note: `Escalated from the ${user.department} team after staff review.`,
    status: 'forwarded',
    level: 'staff_to_head',
  };
}

describe('Indecisive demo flows', () => {
  it(
    'supports the full staff submission to escalation flow',
    async () => {
      const user = userEvent.setup();
      const staffUser = MOCK_USERS[0];
      const submission = buildSubmission(staffUser, 'submission-staff-flow', STAFF_PROBLEM_STATEMENT);
      const blueprints = createDemoBlueprints(STAFF_PROBLEM_STATEMENT);

      renderApp('/scoring', {
        currentUser: staffUser,
        activeSubmission: submission,
        attachments: submission.attachments,
        retrievedContext: createRetrievedContext(STAFF_PROBLEM_STATEMENT),
        blueprints,
        submissionStatus: 'scoring',
        conflictsAcknowledged: true,
        escalationQueue: [],
      });

      expect(
        await screen.findByRole('heading', { name: /Compare blueprints side by side/i }, { timeout: 5000 }),
      ).toBeInTheDocument();

      fireEvent.click(screen.getAllByRole('button', { name: /Select blueprint/i })[0]);
      const escalateButton = screen.getByRole('button', { name: /Escalate blueprint/i });
      await waitFor(() => expect(escalateButton).toBeEnabled());
      fireEvent.click(escalateButton);

      expect(
        await screen.findByRole('heading', { name: /Blueprint escalated successfully/i }, { timeout: 5000 }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Review past submissions/i }));
      expect(await screen.findByRole('heading', { name: /Past submissions/i })).toBeInTheDocument();
      expect(screen.getAllByText(/Our legacy monolith is slowing release cycles/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /Review .* submission/i })).toBeInTheDocument();
    },
    15000,
  );

  it(
    'supports the superior merge to unified strategy flow',
    async () => {
      const user = userEvent.setup();
      const escalationQueue = [
        buildEscalationRecord({
          id: 'escalation-merge-1',
          user: MOCK_USERS[0],
          problemStatement: STAFF_PROBLEM_STATEMENT,
          blueprintIndex: 0,
        }),
        buildEscalationRecord({
          id: 'escalation-merge-2',
          user: MOCK_USERS[0],
          problemStatement: SECOND_PROBLEM_STATEMENT,
          blueprintIndex: 1,
        }),
      ];

      renderApp('/merge', { currentUser: MOCK_USERS[2], escalationQueue });

      expect(screen.getByText('Compare pending escalations and generate a unified strategy')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /Confirm merge and generate strategy/i }));

      expect(await screen.findByText('UNIFIED STRATEGY OUTPUT', {}, { timeout: 4000 })).toBeInTheDocument();
      expect(screen.getByText(/Synthesized from:/i)).toBeInTheDocument();
    },
    10000,
  );
});
