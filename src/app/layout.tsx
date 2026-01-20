import '@cloudscape-design/global-styles/index.css';
import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Consultant Insights Dashboard (Workshop)',
  description: 'PRD + TDD vibe coding workshop demo'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
