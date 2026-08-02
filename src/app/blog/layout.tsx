import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Skincare Science Blog & Dermatologist Advice',
  description: 'Learn skincare science, routines, and dermatology tips from certified specialists. Science-backed advice for curing acne, brightening, and barrier repair.',
  openGraph: {
    title: 'Skincare Science Blog & Dermatologist Advice | BEAUTY GLOWRY',
    description: 'Learn skincare science, routines, and dermatology tips. Science-backed advice for acne, hyperpigmentation, and barrier repair.',
    url: 'https://beautygloowry.com/blog',
    type: 'website',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
