import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Syne } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import AppShell from '../components/AppShell';

const bodyFont = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body-ui',
});

const displayFont = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-display-ui',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-mono-ui',
});

export const metadata: Metadata = {
  title: 'ODIS Demo',
  description: 'Organisational Decision Intelligence System demo built with Next.js.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} font-body`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
