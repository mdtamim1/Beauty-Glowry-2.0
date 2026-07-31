import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "../components/WhatsAppButton";
import AuthInterceptor from "../components/AuthInterceptor";

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
  title: "BEAUTY GLOWRY | Premium Clinical Skincare",
  description: "Dermatologist-formulated active skincare. Precision ingredients for measurable results. Trusted by 10,000+ customers across Bangladesh.",
  keywords: ["skincare", "serum", "niacinamide", "vitamin c", "bangladesh", "clinical skincare", "active ingredients"],
  openGraph: {
    title: "BEAUTY GLOWRY | Premium Clinical Skincare",
    description: "Dermatologist-formulated active skincare for measurable results.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BEAUTY GLOWRY | Premium Clinical Skincare",
    description: "Dermatologist-formulated active skincare for measurable results.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ background: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        {children}
        <AuthInterceptor />
        <WhatsAppButton />
      </body>
    </html>
  );
}
