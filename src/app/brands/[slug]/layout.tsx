import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { brands as staticBrands, products as staticProducts } from '../../../data/products';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

async function getBrandData(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beautyglowry.com';
  try {
    const b = await prisma.brand.findFirst({
      where: {
        id: slug,
      },
      include: {
        products: {
          where: { is_active: true },
          select: { id: true, name: true },
        },
      },
    });

    if (b) {
      return {
        id: b.id,
        name: b.name,
        tagline: 'Clinical Formulations',
        description: b.description || `${b.name} clinical skincare products formulated for maximum efficacy.`,
        country: 'Clinical Lab',
        coverImage: b.logo || `${baseUrl}/logo.PNG`,
        products: b.products.map(p => ({ id: p.id, name: p.name })),
      };
    }
  } catch (err) {
    console.error('[Brand SEO Layout] Failed to fetch brand from DB:', err);
  }

  // Fallback to static brands
  const staticB = staticBrands.find((b) => b.id === slug);
  if (staticB) {
    const brandProds = staticProducts.filter((p) => p.brand === slug);
    return {
      id: staticB.id,
      name: staticB.name,
      tagline: staticB.tagline,
      description: staticB.description,
      country: staticB.country,
      coverImage: staticB.coverImage,
      products: brandProds.map(p => ({ id: String(p.id), name: p.name })),
    };
  }

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const brand = await getBrandData(resolvedParams.slug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beautyglowry.com';

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
      canonical: `${baseUrl}/brands/${brand.id}`,
    },
    openGraph: {
      title: `${brand.name} | BEAUTY GLOWRY`,
      description: `${brand.name} — ${brand.tagline}. Origin: ${brand.country}.`,
      url: `${baseUrl}/brands/${brand.id}`,
      images: [
        {
          url: brand.coverImage,
          alt: brand.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
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
  const brand = await getBrandData(resolvedParams.slug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beautyglowry.com';

  if (!brand) {
    return <>{children}</>;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${brand.name} Formulations`,
    description: brand.description,
    url: `${baseUrl}/brands/${brand.id}`,
    about: {
      '@type': 'Brand',
      name: brand.name,
      description: brand.tagline,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: brand.products.map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${baseUrl}/product/${p.id}`,
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
        item: `${baseUrl}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Brands',
        item: `${baseUrl}/brands`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: brand.name,
        item: `${baseUrl}/brands/${brand.id}`,
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
