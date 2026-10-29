import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConditionalFooter from '@/components/ConditionalFooter';
import ChunkLoadRecovery from '@/components/ChunkLoadRecovery';
import PWAInit from '@/components/PWAInit';
import BottomNav from '@/components/BottomNav';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import MobileSwipeNav from '@/components/MobileSwipeNav';
import MobileSiteFlow from '@/components/MobileSiteFlow';
import HomePageContent from '@/components/site-pages/HomePage';
import AnalyticsProvider from '@/components/AnalyticsProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

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
        <link rel="apple-touch-icon" href="/logo.webp" />
      </head>
      <body className={`${inter.variable} font-sans flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased`}>
        <AnalyticsProvider />
        <PWAInit />
        <MobileSwipeNav />
        <ChunkLoadRecovery />
        <Navbar />
        <main className="flex-1">
          <MobileSiteFlow home={<HomePageContent />} routeContent={children} />
          <div className="hidden lg:block">{children}</div>
        </main>
        <ConditionalFooter>
          <Footer />
        </ConditionalFooter>
        <PWAInstallBanner />
        <BottomNav />
      </body>
    </html>
  );
}
