import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Skincare Wishlist',
  description: 'View and manage your saved clinical skincare products at Beauty Glowry. Keep track of your favorite dermatologist-formulated routines.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
