import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ weight: ["600", "700", "800", "900"], subsets: ["latin"], variable: "--font-poppins" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kikwetuconnect.vercel.app';

export const metadata: Metadata = {
  title: {
    default: "KikwetuConnect - Maarifa Yetu, Hadithi Zetu, Mustakabali Wetu",
    template: "%s | KikwetuConnect",
  },
  description: "East Africa's premier knowledge platform for agriculture, tech, education, and community storytelling. Jiunge na jamii, shiriki maarifa, na kukuza mustakabali wako.",
  keywords: ["Kenya", "agriculture", "KilimoSmart", "education", "tech", "community", "Swahili", "Kikwetu", "East Africa", "farming", "startups"],
  manifest: "/manifest.json",
  icons: { icon: "/logo-icon.svg", apple: "/logo-icon.svg" },
  openGraph: {
    title: "KikwetuConnect - East Africa's Knowledge Platform",
    description: "Maarifa Yetu, Hadithi Zetu, Mustakabali Wetu. Join thousands of Kenyans sharing knowledge in agriculture, tech, education & culture.",
    url: siteUrl,
    siteName: "KikwetuConnect",
    locale: "en_KE",
    type: "website",
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: "KikwetuConnect" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KikwetuConnect",
    description: "East Africa's premier knowledge platform for agriculture, tech, education, and community storytelling.",
    images: [`${siteUrl}/og-image.png`],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "" },
};

export const viewport = {
  themeColor: "#cc5b47",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <link rel="alternate" hrefLang="en" href={siteUrl} />
        <link rel="alternate" hrefLang="sw" href={`${siteUrl}/sw`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "KikwetuConnect",
            url: siteUrl,
            description: "East Africa's knowledge platform for agriculture, tech, education, and community.",
            potentialAction: {
              "@type": "SearchAction",
              target: `${siteUrl}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }} />
      </head>
      <body className="font-sans min-h-screen flex flex-col text-gray-900 dark:text-gray-100 transition-colors duration-300 selection:bg-brand-red selection:text-white touch-manipulation antialiased">
        <Providers>
          <div className="sun-birds" />
          <div className="sun-tracks" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
