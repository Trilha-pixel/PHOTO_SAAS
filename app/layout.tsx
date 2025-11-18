import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gerador de Aniversário Mágico",
  description: "Transforme a foto do seu pequeno em uma obra mágica de arte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}

