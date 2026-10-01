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
  themeColor: "#0a0e1a",
};

export const metadata: Metadata = {
  title: "GridSketch — Digital Drawing Assistant for Artists",
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
    title: "GridSketch — Digital Drawing Assistant for Artists",
    description: "Transform any photo into a calibrated drawing reference. Precision grids, continuous tonal values & physical paper ruler scaling.",
    siteName: "GridSketch",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GridSketch — Digital Drawing Assistant for Artists",
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
      <body className="min-h-full flex flex-col bg-[#0a0e1a] text-[#f0f6fc] font-sans">
        <AnimatedSplashScreen />
        {children}
      </body>
    </html>
  );
}
