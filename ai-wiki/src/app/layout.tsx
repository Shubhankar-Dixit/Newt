import type { Metadata } from "next";
import { Crimson_Text, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const crimson = Crimson_Text({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI Wiki",
  description: "Minimal, AI‑generated encyclopedia articles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${crimson.variable} ${plexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
