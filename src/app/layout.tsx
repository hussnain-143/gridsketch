import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AnimatedSplashScreen } from "@/components/splash/AnimatedSplashScreen";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0b0f14",
};

export const metadata: Metadata = {
  title: "GridSketch — Precision Drawing & Drafting Studio",
  description:
    "Transform any photo into a calibrated drawing reference. Customizable grids, diagonal crosses, continuous tonal values, and physical paper ruler scaling.",
  manifest: "/manifest.webmanifest",
  applicationName: "GridSketch",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GridSketch",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "GridSketch — Precision Drawing & Drafting Studio",
    description: "Transform any photo into a calibrated drawing reference. Precision grids, continuous tonal values & physical paper ruler scaling.",
    siteName: "GridSketch",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GridSketch — Precision Drawing & Drafting Studio",
    description: "Transform any photo into a calibrated drawing reference. Precision grids & drawing modes.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} font-sans h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0b0f14] text-[#f8fafc] font-sans">
        <AnimatedSplashScreen />
        {children}
      </body>
    </html>
  );
}
