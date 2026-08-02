import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Skincare Dashboard',
  description: 'Manage your profile, view order tracking logs, view order history, and track Steadfast courier statuses at Beauty Glowry customer portal.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
