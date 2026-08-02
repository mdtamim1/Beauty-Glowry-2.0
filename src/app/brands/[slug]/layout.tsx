import type { Metadata } from 'next';
import { brands, products } from '../../../data/products';

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
    alternates: {
      canonical: `https://beautygloowry.com/brands/${brand.id}`,
    },
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

export default async function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const brand = brands.find((b) => b.id === resolvedParams.slug);
  const brandProducts = products.filter((p) => p.brand === resolvedParams.slug);

  if (!brand) {
    return <>{children}</>;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${brand.name} Formulations`,
    description: brand.description,
    url: `https://beautygloowry.com/brands/${brand.id}`,
    about: {
      '@type': 'Brand',
      name: brand.name,
      description: brand.tagline,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: brandProducts.map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `https://beautygloowry.com/product/${p.id}`,
        name: p.name,
      })),
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://beautygloowry.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Brands',
        item: 'https://beautygloowry.com/brands',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: brand.name,
        item: `https://beautygloowry.com/brands/${brand.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {children}
    </>
  );
}
