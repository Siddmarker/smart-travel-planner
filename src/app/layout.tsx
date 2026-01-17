import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "2wards",
  description: "AI-Powered Travel Planning",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "2wards",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* CRITICAL FIX: 
        'overflow-x-hidden' stops the page from scrolling sideways on mobile.
        'w-full' ensures it takes up the full width but no more.
      */}
      <body className={`${inter.className} overflow-x-hidden w-full bg-gray-50`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}