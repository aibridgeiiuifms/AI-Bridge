import type { Metadata } from 'next';
import SharePage from '@/components/SharePage';

export const metadata: Metadata = {
  title: 'Share The AI Bridge | FMS IIUI',
  description: 'Share The AI Bridge website and social channels with your community.',
};

export default function ShareRoute() {
  return <SharePage />;
}
