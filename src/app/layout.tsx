import type { Metadata, Viewport } from "next";
import { Playfair_Display, EB_Garamond } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tantaan Tiki Bar",
  description: "Karishma & Atul's home bar — good friends, good times.",
};

export const viewport: Viewport = {
  themeColor: "#14432a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body min-h-screen">{children}</body>
    </html>
  );
}
