import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clinical Skincare Brands',
  description: 'Explore premium clinical skincare brands including DermaLab, PureAct, and our signature line Beauty Glowry. Formulated by dermatologists worldwide.',
  openGraph: {
    title: 'Clinical Skincare Brands | BEAUTY GLOWRY',
    description: 'Explore premium clinical skincare brands including DermaLab, PureAct, and our signature line Beauty Glowry. Formulated by dermatologists worldwide.',
    url: 'https://beautyglowry.com/brands',
    type: 'website',
  },
};

export default function BrandsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
