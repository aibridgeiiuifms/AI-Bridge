import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChunkLoadRecovery from '@/components/ChunkLoadRecovery';
import PWAInit from '@/components/PWAInit';
import BottomNav from '@/components/BottomNav';
import PWAInstallBanner from '@/components/PWAInstallBanner';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'The AI Bridge | FMS IIUI — Hum Hain Pakistan SDG Youth Campaign',
  description:
    'Empowering and bridging the gap for non-IT educators and scholars through source-grounded AI tools and NotebookLM at International Islamic University Islamabad.',
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
  themeColor: '#0F4C3A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/logo.webp" />
      </head>
      <body className="font-sans flex flex-col min-h-screen bg-[#F8F7F4] text-[#0F172A] antialiased selection:bg-[#0F4C3A] selection:text-white">
        <PWAInit />
        <ChunkLoadRecovery />
        <Navbar />
        <main className="flex-1">{children}</main>
        <div className="pb-16 lg:pb-0">
          <Footer />
        </div>
        <PWAInstallBanner />
        <BottomNav />
      </body>
    </html>
  );
}
