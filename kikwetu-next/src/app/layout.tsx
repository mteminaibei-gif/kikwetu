import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ weight: ["600", "700", "800", "900"], subsets: ["latin"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "KikwetuConnect - Maarifa Yetu, Hadithi Zetu, Mustakabali Wetu",
  description: "East Africa's premier knowledge platform for agriculture, tech, education, and community storytelling.",
  manifest: "/manifest.json",
  icons: { icon: "/logo-icon.svg" },
};

export const viewport = {
  themeColor: "#cc5b47",
  width: "device-width" as const,
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="font-sans min-h-screen flex flex-col text-gray-900 dark:text-gray-100 transition-colors duration-300 selection:bg-brand-red selection:text-white">
        <Providers>
          <div className="sun-birds" />
          <div className="sun-tracks" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
