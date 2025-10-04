import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { TradingProvider } from "../contexts/TradingContext";
import { SymbolsProvider } from "../contexts/SymbolsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeIdea - Community Driven",
  description: "Trading ideas and portfolio management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f1419]`}
      >
        <AuthProvider>
          <SymbolsProvider>
            <TradingProvider>
              {children}
            </TradingProvider>
          </SymbolsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
