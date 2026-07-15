import type { Metadata } from "next";
import "./globals.css";
import { Instrument_Sans, Space_Grotesk } from "next/font/google";

import { cn } from "@/lib/utils";

/**
 * Tipografia do Despact: Space Grotesk (display) para títulos e números —
 * dígitos tabulares, carácter técnico — e Instrument Sans para corpo e UI.
 */
const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Despact",
  description: "Plataforma pessoal de finanças orientada a decisões.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={cn("font-sans", sans.variable, display.variable)}>
      <body>{children}</body>
    </html>
  );
}
