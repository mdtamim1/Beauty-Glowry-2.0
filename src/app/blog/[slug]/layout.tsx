import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beautyglowry.com';
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: resolvedParams.slug },
    });

    if (!post) {
      return {
        title: 'Article Not Found',
        description: 'The requested skincare science article could not be found.',
      };
    }

    return {
      title: post.title,
      description: post.summary ?? undefined,
      alternates: {
        canonical: `${baseUrl}/blog/${post.slug}`,
      },
      openGraph: {
        title: `${post.title} | BEAUTY GLOWRY Blog`,
        description: post.summary ?? undefined,
        url: `${baseUrl}/blog/${post.slug}`,
        images: post.cover_image ? [
          {
            url: post.cover_image,
            alt: post.title,
          },
        ] : [],
        type: 'article',
        publishedTime: post.created_at ? new Date(post.created_at).toISOString() : undefined,
        authors: post.author ? [post.author] : [],
        tags: post.tags ?? [],
      },
      twitter: {
        title: `${post.title} | BEAUTY GLOWRY Blog`,
        description: post.summary ?? undefined,
        images: post.cover_image ? [post.cover_image] : [],
      },
    };
  } catch (error) {
    console.error('Error fetching blog metadata:', error);
    return {
      title: 'Skincare Science Blog',
    };
  }
}

export default async function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beautyglowry.com';
  let post = null;

  try {
    post = await prisma.blogPost.findFirst({
      where: { slug: resolvedParams.slug },
    });
  } catch (error) {
    console.error('Error fetching blog post in layout:', error);
  }

  if (!post) {
    return <>{children}</>;
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    image: post.cover_image || undefined,
    datePublished: post.created_at ? new Date(post.created_at).toISOString() : undefined,
    author: {
      '@type': 'Person',
      name: post.author || 'Beauty Glowry Specialist',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Beauty Glowry',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.PNG`,
      },
    },
  };

  const breadcrumbSchema = {
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
        name: 'Blog',
        item: `${baseUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${baseUrl}/blog/${post.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
