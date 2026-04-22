import React from 'react';
import { ReactNode } from 'react';
import { render } from '@testing-library/react';
import AppRouteView from '../app/AppRouteView';
import AppShell from '../components/AppShell';
import { AppProvider, AppState } from '../context/AppContext';
import { ThemeProvider } from '../context/ThemeContext';
import { resetNavigation } from './navigationMock';

export function renderApp(route: string, initialState?: Partial<AppState>, children?: ReactNode) {
  resetNavigation(route);

  return render(
    <ThemeProvider>
      <AppProvider initialState={initialState}>
        <AppShell>{children ?? <AppRouteView />}</AppShell>
      </AppProvider>
    </ThemeProvider>,
  );
}
