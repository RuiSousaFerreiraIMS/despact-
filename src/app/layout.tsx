import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
