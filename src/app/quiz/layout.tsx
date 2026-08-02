import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Skincare Routine Builder & Skin Diagnostic',
  description: 'Take our 2-minute clinical skin diagnostic test. Get a personalized dermatologist-approved routine designed for your unique skin type and concerns.',
  openGraph: {
    title: 'Skincare Routine Builder & Skin Diagnostic | BEAUTY GLOWRY',
    description: 'Take our 2-minute clinical skin diagnostic test. Get a personalized dermatologist-approved routine designed for your unique skin type.',
    url: 'https://beautygloowry.com/quiz',
    type: 'website',
  },
  twitter: {
    title: 'Skincare Routine Builder & Skin Diagnostic | BEAUTY GLOWRY',
    description: 'Find your perfect skincare routine in 2 minutes with our clinical skin diagnostic.',
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
