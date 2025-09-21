// apps/web/app/layout.tsx
import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: {
    default: 'Lazy Fers',
    template: '%s • Lazy Fers',
  },
  description: 'Only what is wrong today. Immutable proof attached.',
  openGraph: {
    title: 'Lazy Fers',
    description: 'Only what is wrong today. Immutable proof attached.',
    url: '/',
    siteName: 'Lazy Fers',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
