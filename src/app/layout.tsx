import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* 見出しの書体。9件が同じ字面だと、並んだときに見分けが付かない */
const display = Archivo({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://use-right-click.kkweb.io"),
  alternates: { canonical: "/" },
  title: "use-right-click",
  description:
    "React hook for custom context menus with desktop right-click and mobile long-press support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${display.variable}`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
