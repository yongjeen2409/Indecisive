import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MOCK_USERS } from './data/mockData';
import { renderApp } from './test/renderApp';

describe('Indecisive route guards', () => {
  it('redirects unauthenticated users to the login screen', () => {
    renderApp('/dashboard');
    expect(screen.getByText('Welcome to Indecisive')).toBeInTheDocument();
  });

  it('keeps staff users out of superior-only routes', () => {
    renderApp('/merge', { currentUser: MOCK_USERS[0] });
    expect(screen.getByText(`Welcome back, ${MOCK_USERS[0].name}`)).toBeInTheDocument();
    expect(screen.queryByText('Compare pending escalations and generate a unified strategy')).not.toBeInTheDocument();
  });

  it('keeps superior users out of staff-only routes', () => {
    renderApp('/submit', { currentUser: MOCK_USERS[2] });
    expect(screen.getByText(`Leadership review center for ${MOCK_USERS[2].name}`)).toBeInTheDocument();
    expect(screen.queryByText('Describe the business problem Indecisive should solve')).not.toBeInTheDocument();
  });

  it('redirects superior users away from output when no merged strategy exists', () => {
    renderApp('/output', { currentUser: MOCK_USERS[2], mergedStrategy: null });
    expect(screen.getByText('Compare pending escalations and generate a unified strategy')).toBeInTheDocument();
  });

  it('lets users switch accounts from the navbar badge', async () => {
    const user = userEvent.setup();

    renderApp('/submit', { currentUser: MOCK_USERS[0] });

    await user.click(screen.getByRole('button', { name: /switch user/i }));
    await user.click(screen.getByRole('menuitemradio', { name: /Priya Sharma/i }));

    expect(await screen.findByText(`Leadership review center for ${MOCK_USERS[1].name}`)).toBeInTheDocument();
    expect(screen.queryByText('Describe the business problem Indecisive should solve')).not.toBeInTheDocument();
  });
});
