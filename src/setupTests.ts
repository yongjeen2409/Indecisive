import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { mockRouter, resetNavigation, useMockPathname, useMockSearchParams } from './test/navigationMock';

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: useMockPathname,
  useSearchParams: useMockSearchParams,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string | URL; children: React.ReactNode }) =>
    React.createElement('a', { href: href.toString(), ...props }, children),
}));

afterEach(() => {
  resetNavigation('/');
});
