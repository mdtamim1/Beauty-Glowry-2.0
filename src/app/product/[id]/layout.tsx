import type { Metadata } from 'next';
import { products } from '../../../data/products';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const product = products.find((p) => p.id === Number(resolvedParams.id));

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested clinical skincare product could not be found.',
    };
  }

  return {
    title: product.name,
    description: `${product.name} — ${product.description.slice(0, 150)}... Formulated with premium actives for ${product.concerns.join(', ')}. Target skin types: ${product.skinTypes.join(', ')}.`,
    alternates: {
      canonical: `https://beautygloowry.com/product/${product.id}`,
    },
    openGraph: {
      title: `${product.name} | BEAUTY GLOWRY`,
      description: `${product.name} — ${product.description.slice(0, 150)}... Price: ৳${product.price.toLocaleString()}. Targeted for ${product.concerns.join(', ')}.`,
      url: `https://beautygloowry.com/product/${product.id}`,
      images: [
        {
          url: product.image,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
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
  const product = products.find((p) => p.id === Number(resolvedParams.id));

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
      name: product.brand === 'beauty-glowry' ? 'Beauty Glowry' : product.brand === 'dermalab' ? 'DermaLab' : 'PureAct',
    },
    offers: {
      '@type': 'Offer',
      url: `https://beautygloowry.com/product/${product.id}`,
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
        item: 'https://beautygloowry.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: 'https://beautygloowry.com/products',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.category,
        item: `https://beautygloowry.com/products?category=${encodeURIComponent(product.category)}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: product.name,
        item: `https://beautygloowry.com/product/${product.id}`,
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
