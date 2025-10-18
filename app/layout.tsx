import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { AccountsProvider } from "../contexts/AccountsContext";
import { TradingProvider } from "../contexts/TradingContext";
import { SymbolsProvider } from "../contexts/SymbolsContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import GoogleAnalytics from "../components/GoogleAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeIdea - Never Miss Another Entry or Exit | Automated Alerts for Indian Stock Traders",
  description: "Automated portfolio tracking with real-time alerts for Indian stock traders. Get instant notifications when stocks hit entry, target, or stop-loss levels. Import from Zerodha/ICICI in one click. Free forever.",
  keywords: ["automated stock alerts", "portfolio tracking", "Indian stock market", "technical analysis", "Zerodha import", "ICICI Direct", "entry exit alerts", "stop loss alerts", "trading alerts India", "stock portfolio management", "real-time stock alerts"],
  icons: {
    icon: [
      { url: '/icon', sizes: '32x32', type: 'image/png' },
      { url: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icon',
  },
  openGraph: {
    title: "TradeIdea - Never Miss Another Entry or Exit | Automated Alerts",
    description: "Automated portfolio tracking with real-time alerts for Indian stock traders. Get instant notifications when stocks hit entry, target, or stop-loss levels. Import from Zerodha/ICICI in one click.",
    url: "https://tradeidea.co.in",
    siteName: "TradeIdea",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TradeIdea - Automated Stock Alerts for Indian Traders",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeIdea - Automated Stock Alerts for Indian Traders",
    description: "Never miss entry/exit opportunities. Get instant alerts when stocks hit your target, stop-loss levels. Import from Zerodha/ICICI. Free forever.",
    images: ["/twitter-image"],
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
        <GoogleAnalytics />
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
