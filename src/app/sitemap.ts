import { MetadataRoute } from 'next';
import { products } from '../data/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://beautygloowry.com';

  const staticUrls = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/products`, lastModified: new Date() },
    { url: `${baseUrl}/quiz`, lastModified: new Date() },
    { url: `${baseUrl}/blog`, lastModified: new Date() },
    { url: `${baseUrl}/brands`, lastModified: new Date() },
  ];

  const productUrls = products.map((prod) => ({
    url: `${baseUrl}/product/${prod.id}`,
    lastModified: new Date(),
  }));

  return [...staticUrls, ...productUrls];
}
