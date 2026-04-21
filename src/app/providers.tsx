'use client';

import { ReactNode } from 'react';
import { AppProvider } from '../context/AppContext';
import { ThemeProvider } from '../context/ThemeContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AppProvider>{children}</AppProvider>
    </ThemeProvider>
  );
}
