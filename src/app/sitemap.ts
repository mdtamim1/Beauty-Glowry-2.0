import { MetadataRoute } from 'next';
import { prisma } from '../lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://beautygloowry.com';

  const staticUrls = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/products`, lastModified: new Date() },
    { url: `${baseUrl}/quiz`, lastModified: new Date() },
    { url: `${baseUrl}/blog`, lastModified: new Date() },
    { url: `${baseUrl}/brands`, lastModified: new Date() },
  ];

  // Database active products mapping
  let dbProductUrls: { url: string; lastModified: Date }[] = [];
  try {
    const dbProducts = await prisma.product.findMany({
      where: { is_active: true },
      select: { id: true },
    });
    dbProductUrls = dbProducts.map((p) => ({
      url: `${baseUrl}/product/${p.id}`,
      lastModified: new Date(),
    }));
  } catch (e) {
    console.error('[Sitemap] Failed to load DB products:', e);
  }

  // Database published blog posts mapping
  let dbBlogUrls: { url: string; lastModified: Date }[] = [];
  try {
    const dbPosts = await prisma.blogPost.findMany({
      where: { is_published: true },
      select: { slug: true, created_at: true },
    });
    dbBlogUrls = dbPosts.map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : new Date(),
    }));
  } catch (e) {
    console.error('[Sitemap] Failed to load DB blogs:', e);
  }

  return [...staticUrls, ...dbProductUrls, ...dbBlogUrls];
}
