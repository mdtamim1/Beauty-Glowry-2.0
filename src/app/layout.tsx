import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "../components/WhatsAppButton";
import AuthInterceptor from "../components/AuthInterceptor";
import CompareTray from "../components/CompareTray";
import { prisma } from "../lib/prisma";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let storeConfig = {
    storeName: 'Beauty Glowry',
    storeTagline: 'Clinical Skincare for Every Skin Type',
    storeEmail: 'hello@beautyglowry.com',
    storePhone: '+880 1700 000000',
    storeAddress: 'House 12, Road 4, Dhanmondi, Dhaka 1205',
    googleSiteVerification: '',
    bingSiteVerification: '',
  };

  try {
    const section = await prisma.homepageSection.findFirst({
      where: { section_type: 'store_settings' },
    });
    if (section) {
      const parsed = JSON.parse(section.config_json || '{}');
      storeConfig = { ...storeConfig, ...parsed };
    }
  } catch (e) {
    console.error('[RootLayout] Failed to load store settings:', e);
  }

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
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <head>
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
        {children}
        <AuthInterceptor />
        <WhatsAppButton />
        <CompareTray />
      </body>
    </html>
  );
}
