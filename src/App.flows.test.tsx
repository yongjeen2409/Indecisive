import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MOCK_USERS } from './data/mockData';
import { renderApp } from './test/renderApp';

const STAFF_PROBLEM_STATEMENT =
  'Our legacy monolith is slowing release cycles and creating risk whenever multiple teams need to ship at the same time.';

describe('ODIS demo flows', () => {
  it(
    'supports the full staff submission to escalation flow',
    async () => {
      const user = userEvent.setup();

      renderApp('/login');

      await user.click(screen.getByRole('button', { name: 'Continue' }));
      await screen.findByRole('button', { name: /Department Staff/i }, { timeout: 2500 });

      await user.click(screen.getByRole('button', { name: /Department Staff/i }));
      expect(await screen.findByText(`Welcome back, ${MOCK_USERS[0].name}`)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Start a new problem/i }));
      expect(await screen.findByText('Describe the business problem ODIS should solve')).toBeInTheDocument();

      fireEvent.change(screen.getByRole('textbox'), { target: { value: STAFF_PROBLEM_STATEMENT } });
      const analyzeButton = screen.getByRole('button', { name: /Analyze with ODIS/i });
      expect(analyzeButton).toBeEnabled();
      await user.click(analyzeButton);

      expect(
        await screen.findByText(/Building solution blueprints/i, {}, { timeout: 2000 }),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole('heading', { name: /ODIS generated 3 solution blueprints/i }, { timeout: 7000 }),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Rank 1/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Continue to conflict review/i }));
      expect(await screen.findByText(/GLM-detected conflicts must be reviewed first/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Acknowledge conflicts and open scoring/i }));
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
    },
    15000,
  );

  it(
    'supports the superior merge to unified strategy flow',
    async () => {
      const user = userEvent.setup();

      renderApp('/merge', { currentUser: MOCK_USERS[1] });

      expect(screen.getByText('Compare pending escalations and generate a unified strategy')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /Confirm merge and generate strategy/i }));

      expect(await screen.findByText('UNIFIED STRATEGY OUTPUT', {}, { timeout: 4000 })).toBeInTheDocument();
      expect(screen.getByText(/Synthesized from:/i)).toBeInTheDocument();
    },
    10000,
  );
});
