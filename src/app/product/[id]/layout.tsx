import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { products as staticProducts } from '../../../data/products';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

async function getProductData(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beautyglowry.com';
  try {
    const p = await prisma.product.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id },
        ],
      },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { position: 'asc' } },
        reviews: { select: { rating: true } },
      },
    });

    if (p) {
      const reviews = p.reviews || [];
      const reviewCount = reviews.length;
      const averageRating = reviewCount > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
        : 5.0;

      return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: Number(p.price),
        image: p.images[0]?.url || `${baseUrl}/logo.PNG`,
        brand: p.brand?.name || 'Beauty Glowry',
        category: p.category?.name || 'Skincare',
        stock: p.stock_qty,
        rating: averageRating,
        reviewCount: reviewCount,
        concerns: p.skin_type_tags || [],
        skinTypes: p.skin_type_tags || [],
      };
    }
  } catch (err) {
    console.error('[Product SEO Layout] Failed to fetch product from DB:', err);
  }

  // Fallback to static data if DB record is not found or connection fails
  const numId = Number(id);
  const staticP = staticProducts.find((p) => p.id === numId);
  if (staticP) {
    return {
      id: String(staticP.id),
      name: staticP.name,
      description: staticP.description || '',
      price: staticP.price,
      image: staticP.image,
      brand: staticP.brand === 'beauty-glowry' ? 'Beauty Glowry' : staticP.brand === 'dermalab' ? 'DermaLab' : 'PureAct',
      category: staticP.category || 'Skincare',
      stock: staticP.stock || 10,
      rating: staticP.rating || 5.0,
      reviewCount: staticP.reviewCount || 1,
      concerns: staticP.concerns || [],
      skinTypes: staticP.skinTypes || [],
    };
  }

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductData(resolvedParams.id);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beautyglowry.com';

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested clinical skincare product could not be found.',
    };
  }

  const concernsText = product.concerns.length > 0 ? ` Formulated for ${product.concerns.join(', ')}.` : '';
  const skinTypesText = product.skinTypes.length > 0 ? ` Suitable for ${product.skinTypes.join(', ')}.` : '';
  const descriptionSnippet = `${product.name} — ${product.description.slice(0, 150)}...${concernsText}${skinTypesText}`;

  return {
    title: product.name,
    description: descriptionSnippet,
    alternates: {
      canonical: `${baseUrl}/product/${product.id}`,
    },
    openGraph: {
      title: `${product.name} | BEAUTY GLOWRY`,
      description: `${product.name} — ${product.description.slice(0, 150)}... Price: ৳${product.price.toLocaleString()}.${concernsText}`,
      url: `${baseUrl}/product/${product.id}`,
      images: [
        {
          url: product.image,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | BEAUTY GLOWRY`,
      description: `${product.description.slice(0, 120)}...`,
      images: [product.image],
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const product = await getProductData(resolvedParams.id);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beautyglowry.com';

  if (!product) {
    return <>{children}</>;
  }

  // Construct JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    description: product.description,
    sku: `BG-SKU-${product.id}`,
    mpn: `BG-MPN-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/product/${product.id}`,
      priceCurrency: 'BDT',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      priceValidUntil: '2028-12-31',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount > 0 ? product.reviewCount : 1,
      bestRating: '5',
      worstRating: '1',
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
        name: 'Products',
        item: `${baseUrl}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.category,
        item: `${baseUrl}/products?category=${encodeURIComponent(product.category)}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: product.name,
        item: `${baseUrl}/product/${product.id}`,
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
