import type { Metadata } from "next";
import "./globals.css";
import WhatsAppButton from "../components/WhatsAppButton";
import AuthInterceptor from "../components/AuthInterceptor";
import CompareTray from "../components/CompareTray";
import NextAuthProvider from "../components/NextAuthProvider";
import { prisma } from "../lib/prisma";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://beautyglowry.com"),
  title: {
    default: "BEAUTY GLOWRY | Premium Clinical Skincare",
    template: "%s | BEAUTY GLOWRY"
  },
  description: "Dermatologist-formulated active skincare. Precision ingredients for measurable results. Trusted by 10,000+ customers across Bangladesh.",
  keywords: ["skincare", "serum", "niacinamide", "vitamin c", "bangladesh", "clinical skincare", "active ingredients", "acne solution", "dark spots treatment"],
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || '',
    },
  },
  openGraph: {
    title: "BEAUTY GLOWRY | Premium Clinical Skincare",
    description: "Dermatologist-formulated active skincare for measurable results. Trusted by 10,000+ customers across Bangladesh.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://beautyglowry.com",
    siteName: "Beauty Glowry",
    images: [
      {
        url: "/logo.PNG",
        width: 800,
        height: 600,
        alt: "Beauty Glowry Logo",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BEAUTY GLOWRY | Premium Clinical Skincare",
    description: "Dermatologist-formulated active skincare for measurable results.",
    images: ["/logo.PNG"],
  },
};

// ─── In-memory cache for store config (avoids DB query on every page request) ───
const DEFAULT_STORE_CONFIG = {
  storeName: 'Beauty Glowry',
  storeTagline: 'Clinical Skincare for Every Skin Type',
  storeEmail: 'hello@beautyglowry.com',
  storePhone: '+880 1700 000000',
  storeAddress: 'House 12, Road 4, Dhanmondi, Dhaka 1205',
  googleSiteVerification: '',
  bingSiteVerification: '',
};

let _storeConfigCache: typeof DEFAULT_STORE_CONFIG | null = null;
let _storeConfigCachedAt = 0;
const STORE_CONFIG_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getStoreConfig() {
  const now = Date.now();
  if (_storeConfigCache && now - _storeConfigCachedAt < STORE_CONFIG_TTL_MS) {
    return _storeConfigCache;
  }
  let config = { ...DEFAULT_STORE_CONFIG };
  try {
    const section = await prisma.homepageSection.findFirst({
      where: { section_type: 'store_settings' },
    });
    if (section) {
      const parsed = JSON.parse(section.config_json || '{}');
      config = { ...config, ...parsed };
    }
  } catch (e) {
    console.error('[RootLayout] Failed to load store settings:', e);
  }
  _storeConfigCache = config;
  _storeConfigCachedAt = now;
  return config;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storeConfig = await getStoreConfig();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beautyglowry.com';

  // Construct JSON-LD schemas
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: storeConfig.storeName,
    url: baseUrl,
    logo: `${baseUrl}/logo.PNG`,
    description: storeConfig.storeTagline,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: storeConfig.storePhone,
      contactType: 'customer service',
      areaServed: 'BD',
      availableLanguage: ['en', 'bn'],
    },
    sameAs: [
      'https://www.facebook.com/beautyglowry',
      'https://www.instagram.com/beautyglowry',
    ],
  };

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: storeConfig.storeName,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/products?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {storeConfig.googleSiteVerification && (
          <meta name="google-site-verification" content={storeConfig.googleSiteVerification} />
        )}
        {storeConfig.bingSiteVerification && (
          <meta name="msvalidate.01" content={storeConfig.bingSiteVerification} />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ background: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <NextAuthProvider>
          {children}
          <AuthInterceptor />
          <WhatsAppButton />
          <CompareTray />
        </NextAuthProvider>
      </body>
    </html>
  );
}
