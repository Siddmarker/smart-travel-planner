import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. Initialize the Font (Inter)
const inter = Inter({ subsets: ["latin"] });

// 2. Define SEO Metadata (Title & Description)
export const metadata: Metadata = {
  title: "2wards - AI Travel Planner",
  description: "Plan your next adventure with AI, collaborate with friends, and track expenses.",
};

// 3. CRITICAL MOBILE FIX: Define Viewport Settings
// This tells the browser: "Do not auto-zoom out. Scale 1:1 on mobile."
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Also good for iPhone notch support:
  viewportFit: "cover",
};

// 4. The Root Layout Component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* The main app content renders here */}
        {children}
      </body>
    </html>
  );
}