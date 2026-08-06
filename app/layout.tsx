import type { Metadata } from "next";
import { Roboto, Playfair_Display, Bebas_Neue, Outfit, Montserrat } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/shared/toast-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";

const roboto = Roboto({
  weight: ['400', '500', '700', '900'],
  variable: "--font-roboto",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  weight: ['400', '600', '700', '900'],
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ['normal', 'italic'],
});

const bebas = Bebas_Neue({
  weight: '400',
  variable: "--font-bebas",
  subsets: ["latin"],
});

const outfit = Outfit({
  weight: ['400', '600', '700', '800', '900'],
  variable: "--font-outfit",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  weight: ['400', '600', '700', '800', '900'],
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KOMPONG DEWA EVENTS",
  description:
    "Upload images, generate shareable links and QR codes. A minimal file-sharing dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${playfair.variable} ${bebas.variable} ${outfit.variable} ${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
