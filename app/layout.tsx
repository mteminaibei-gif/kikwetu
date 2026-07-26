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
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://kikwetuconnect.com",
    title: "KikwetuConnect - Our Knowledge, Our Stories, Our Future",
    description: "Kenya's premier education and community platform for knowledge sharing and professional growth",
  },
  twitter: {
    card: "summary_large_image",
    title: "KikwetuConnect",
    description: "Our Knowledge, Our Stories, Our Future",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0ece4" },
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
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
