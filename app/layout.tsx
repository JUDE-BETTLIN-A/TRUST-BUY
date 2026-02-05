import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import { TopNavbar } from "@/components/TopNavbar";
import { SessionProvider } from "@/components/providers";
import { AlertManager } from "@/components/AlertManager";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
});

export const metadata: Metadata = {
  title: "TrustBuy - Intelligent Shopping",
  description: "Buy right. Buy with trust. AI-powered price analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body
        className={`${manrope.variable} antialiased font-display bg-background-light dark:bg-background-dark text-text-main dark:text-white transition-colors duration-200 overflow-hidden`}
      >
        <SessionProvider>
          {/* <Navbar /> */}
          <div className="flex flex-col h-screen w-full overflow-hidden">
            <TopNavbar />
            <div className="flex-1 overflow-auto">
              {children}
              <AlertManager />
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
