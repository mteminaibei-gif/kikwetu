import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kikwetuconnect.com"),
  title: {
    default: "KikwetuConnect - Our Knowledge, Our Stories, Our Future",
    template: "%s | KikwetuConnect",
  },
  description: "Join KikwetuConnect, Kenya's premier education and community platform. Ask questions, share knowledge, and connect with thousands of Kenyans passionate about learning and growth.",
  keywords: [
    "Kikwetu",
    "Baraza",
    "Heshima",
    "M-Pesa",
    "Nyumba Kumi",
    "Mtaa Exchange",
    "Kenya",
    "education",
    "Q&A",
    "community",
    "knowledge sharing",
    "social platform",
    "professional networking",
    "Nairobi",
    "diaspora",
    "Kiswahili",
  ],
  authors: [{ name: "KikwetuConnect Team" }],
  creator: "KikwetuConnect",
  category: "Community & Education",
  classification: "Social Networking & Knowledge Sharing Platform",
  formatDetection: {
    email: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://kikwetuconnect.com",
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://kikwetuconnect.com",
    siteName: "KikwetuConnect",
    title: "KikwetuConnect - Our Knowledge, Our Stories, Our Future",
    description: "Kenya's premier education and community platform for knowledge sharing and professional growth",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KikwetuConnect - Our Knowledge, Our Stories, Our Future",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KikwetuConnect",
    description: "Our Knowledge, Our Stories, Our Future",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2d6a1e" },
    { media: "(prefers-color-scheme: dark)", color: "#1a261e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#2d6a1e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
