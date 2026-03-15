import "./globals.css";
import type { Metadata, Viewport } from "next";
import Providers from "./providers";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://apollos-finance.vercel.app";

export const metadata: Metadata = {
  title: "Apollos Finance - The Cross-Chain, LVR-Protected, & Linearized Yield Protocol",
  description: "Tame volatility, linearize gains",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/images/Logo.png",
  },
  openGraph: {
    title: "Apollos Finance - The Cross-Chain, LVR-Protected, & Linearized Yield Protocol",
    description: "Tame volatility, linearize gains",
    url: "/",
    siteName: "Apollos Finance",
    type: "website",
    images: [
      {
        url: "/images/OG-Banner.jpeg",
        alt: "Apollos Finance Open Graph Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Apollos Finance - The Cross-Chain, LVR-Protected, & Linearized Yield Protocol",
    description: "Tame volatility, linearize gains",
    images: ["/images/OG-Banner.jpeg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Syne:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
