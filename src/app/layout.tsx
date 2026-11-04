import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Xmastize your logo",
  description: "Add a Santa hat, beard, candy cane or elf hat to your logo, then download it as GIF, PNG or SVG.",
  openGraph: {
    title: "Xmastize your logo",
    description: "Add a Santa hat, beard, candy cane or elf hat to your logo, then download it as GIF, PNG or SVG.",
    url: "https://xmas-logo.vercel.app",
    siteName: "Xmastize your logo",
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} dark h-full antialiased`}>
      <body className="min-h-dvh bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
