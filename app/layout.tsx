import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { AccountsProvider } from "../contexts/AccountsContext";
import { TradingProvider } from "../contexts/TradingContext";
import { SymbolsProvider } from "../contexts/SymbolsContext";
import { ThemeProvider } from "../contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeIdea - Community Driven Trading Ideas",
  description: "Discover and share trading opportunities with the community. Track your portfolio and follow the best trading ideas.",
  openGraph: {
    title: "TradeIdea - Community Driven Trading Ideas",
    description: "Discover and share trading opportunities with the community. Track your portfolio and follow the best trading ideas.",
    url: "https://tradeidea.co.in",
    siteName: "TradeIdea",
    images: [
      {
        url: "/icon.svg",
        width: 64,
        height: 64,
        alt: "TradeIdea Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "TradeIdea - Community Driven Trading Ideas",
    description: "Discover and share trading opportunities with the community",
    images: ["/icon.svg"],
  },
  metadataBase: new URL("https://tradeidea.co.in"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'system';
                  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <AccountsProvider>
              <SymbolsProvider>
                <TradingProvider>
                  {children}
                </TradingProvider>
              </SymbolsProvider>
            </AccountsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
