import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secure Checkout',
  description: 'Complete your order securely at Beauty Glowry. Fast express delivery across Bangladesh, Cash on Delivery, and secure digital payment methods available.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
