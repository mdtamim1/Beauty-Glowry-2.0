import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/checkout/success'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://beautyglowry.com'}/sitemap.xml`,
  };
}
