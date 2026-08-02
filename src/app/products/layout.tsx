import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clinical Skincare Products Catalog',
  description: 'Shop dermatologist-formulated active skincare treatments at Beauty Glowry. Clean, clinical formulas including Vitamin C, Niacinamide, and Salicylic Acid serums.',
  alternates: {
    canonical: 'https://beautygloowry.com/products',
  },
  openGraph: {
    title: 'Clinical Skincare Products Catalog | BEAUTY GLOWRY',
    description: 'Shop dermatologist-formulated active skincare treatments. Premium formulas targeted for acne, fine lines, dark spots, and sensitive skin.',
    url: 'https://beautygloowry.com/products',
    type: 'website',
  },
  twitter: {
    title: 'Clinical Skincare Products Catalog | BEAUTY GLOWRY',
    description: 'Shop dermatologist-formulated active skincare treatments at Beauty Glowry.',
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
