import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
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
        canonical: `https://beautygloowry.com/blog/${post.slug}`,
      },
      openGraph: {
        title: `${post.title} | BEAUTY GLOWRY Blog`,
        description: post.summary ?? undefined,
        url: `https://beautygloowry.com/blog/${post.slug}`,
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

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
