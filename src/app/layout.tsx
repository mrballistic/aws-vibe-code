import '@cloudscape-design/global-styles/index.css';
import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'AWS Usage Insights Dashboard - Wellness Domain',
  description: 'Seller dashboard for AWS customer usage insights'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
