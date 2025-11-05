import type { Metadata, Viewport } from "next";
import { Open_Sans, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { ThemeProviders } from "@/components/providers";

const openSans = Open_Sans({
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-open-sans",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

export const metadata: Metadata = {
  title: "Image Editor",
  description: "Edit images using Google DeepMind Gemini 2.0",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "white" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${openSans.className} ${bebasNeue.variable} antialiased text-gray-900 relative min-h-screen`}
        style={{
          backgroundImage: "url('/logo/gabinete.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        suppressHydrationWarning
      >
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px] -z-10"
          aria-hidden="true"
        />
        <ThemeProviders>{children}</ThemeProviders>
      </body>
    </html>
  );
}
