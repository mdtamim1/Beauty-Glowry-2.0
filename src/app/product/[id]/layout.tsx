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

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
