import type { Metadata } from 'next';
import { brands } from '../../../data/products';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const brand = brands.find((b) => b.id === resolvedParams.slug);

  if (!brand) {
    return {
      title: 'Brand Not Found',
      description: 'The requested clinical skincare brand could not be found.',
    };
  }

  return {
    title: brand.name,
    description: `${brand.name} — ${brand.tagline}. ${brand.description}`,
    openGraph: {
      title: `${brand.name} | BEAUTY GLOWRY`,
      description: `${brand.name} — ${brand.tagline}. Origin: ${brand.country}.`,
      url: `https://beautygloowry.com/brands/${brand.id}`,
      images: [
        {
          url: brand.coverImage,
          alt: brand.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      title: `${brand.name} | BEAUTY GLOWRY`,
      description: brand.tagline,
      images: [brand.coverImage],
    },
  };
}

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
