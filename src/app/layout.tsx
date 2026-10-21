import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChunkLoadRecovery from '@/components/ChunkLoadRecovery';

export const metadata: Metadata = {
  title: 'The AI Bridge | FMS IIUI - Hum Hain Pakistan SDG Youth Campaign',
  description: 'Empowering and bridging the gap for non-IT educators and learners through source-grounded AI tools and NotebookLM.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased">
        <ChunkLoadRecovery />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
