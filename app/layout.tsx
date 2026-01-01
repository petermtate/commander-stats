import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const font = Manrope({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Commander Stats",
  description: "Analyze any Commander deck in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.variable} min-h-screen bg-background font-sans text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-gradient-to-br from-background via-background to-muted/20">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
