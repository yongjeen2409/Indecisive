'use client';

import { ReactNode } from 'react';
import { AppProvider } from '../context/AppContext';

export default function Providers({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
