import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/checkout/success'],
    },
    sitemap: 'https://beautyglowry.com/sitemap.xml',
  };
}
