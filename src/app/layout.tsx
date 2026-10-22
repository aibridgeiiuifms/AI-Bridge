import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChunkLoadRecovery from '@/components/ChunkLoadRecovery';
import PWAInit from '@/components/PWAInit';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'The AI Bridge | FMS IIUI - Hum Hain Pakistan SDG Youth Campaign',
  description:
    'Empowering and bridging the gap for non-IT educators and learners through source-grounded AI tools and NotebookLM.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI Bridge',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#065f46',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA: Apple touch icon */}
        <link rel="apple-touch-icon" href="/logo.jpg" />
      </head>
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased">
        <PWAInit />
        <ChunkLoadRecovery />
        <Navbar />
        {/* pb-20 lg:pb-0 → reserves space for the bottom nav on mobile */}
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        {/* Footer hidden on mobile; BottomNav replaces it */}
        <div className="hidden lg:block">
          <Footer />
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
