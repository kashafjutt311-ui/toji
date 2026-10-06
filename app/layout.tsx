import type { Metadata, Viewport } from "next";
import { Syne, Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { SITE } from "@/data/copy";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Nav } from "@/components/nav/Nav";
import "./globals.css";

const syne = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["700", "800"], display: "swap" });
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  display: "swap",
});
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["400", "500"], display: "swap" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s — ${SITE.name}` },
  description: SITE.description,
  icons: { icon: "/brand/logo.svg" },
  openGraph: { type: "website", siteName: SITE.name, images: ["/video/poster.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${instrument.variable} ${interTight.variable} ${jetbrains.variable} antialiased`}
    >
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SmoothScroll />
        <Nav />
        {children}
      </body>
    </html>
  );
}
