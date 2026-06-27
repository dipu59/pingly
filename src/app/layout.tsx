import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pingly — Connect. Chat. Share.',
  description:
    'Pingly is a modern realtime messaging app for teams and friends. Fast, beautiful, and private.',
  keywords: ['chat', 'messaging', 'realtime', 'pingly'],
  openGraph: {
    title: 'Pingly',
    description: 'Modern realtime messaging',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
