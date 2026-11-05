import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

// Bump v when og.png changes: WhatsApp and LinkedIn cache previews by URL.
const OG_IMAGE = {
  url: "/og.png?v=2",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "The Kora logo before and after, with a Santa hat on its A",
};

// The same card with the hat doing the jump, rendered by npm run og:video.
// Absolute: Next resolves og:image against metadataBase but not og:video.
const OG_VIDEO_URL = "https://xmas-logo.vercel.app/og.mp4?v=2";
const OG_VIDEO = {
  url: OG_VIDEO_URL,
  secureUrl: OG_VIDEO_URL,
  type: "video/mp4",
  width: 1200,
  height: 630,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://xmas-logo.vercel.app"),
  title: "Xmastize your logo",
  description: "Add a Santa hat, beard, candy cane or elf hat to your logo, then download it as GIF, PNG or SVG.",
  openGraph: {
    title: "Xmastize your logo",
    description: "Add a Santa hat, beard, candy cane or elf hat to your logo, then download it as GIF, PNG or SVG.",
    url: "https://xmas-logo.vercel.app",
    siteName: "Xmastize your logo",
    locale: "en_US",
    type: "website",
    images: [OG_IMAGE],
    videos: [OG_VIDEO],
  },
  twitter: {
    card: "summary_large_image",
    title: "Xmastize your logo",
    description: "Add a Santa hat, beard, candy cane or elf hat to your logo, then download it as GIF, PNG or SVG.",
    images: [OG_IMAGE],
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
        <Analytics />
      </body>
    </html>
  );
}
