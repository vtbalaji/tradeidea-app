import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { SubscriptionProvider } from "../contexts/SubscriptionContext";
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
  title: "TradeIdea - Portfolio Tracker for Indian Stock Market | Free Automated Alerts",
  description: "Made in India for Indian investors. Track NSE/BSE stocks automatically with real-time alerts. Import from Zerodha, ICICI Direct. Get instant email notifications for entry, target & stop-loss. 100% FREE - NOT a forex trading platform.",
  keywords: [
    "Indian stock portfolio tracker",
    "NSE BSE portfolio management",
    "Zerodha portfolio import",
    "ICICI Direct import",
    "Indian stock alerts",
    "equity portfolio tracker India",
    "stock market alerts India",
    "portfolio tracking NSE",
    "Indian stock analysis",
    "made in India portfolio app",
    "Indian stock screener",
    "technical analysis India",
    "fundamental analysis NSE BSE"
  ],
  authors: [{ name: "TradeIdea" }],
  creator: "TradeIdea",
  publisher: "TradeIdea",
  robots: "index, follow",
  alternates: {
    canonical: "https://tradeidea.co.in"
  },
  icons: {
    icon: [
      { url: '/icon', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icon',
  },
  openGraph: {
    title: "TradeIdea - Portfolio Tracker for Indian Stock Market | Free Automated Alerts",
    description: "Made in India for Indian investors. Track NSE/BSE stocks with automated alerts. Import from Zerodha, ICICI Direct. 100% FREE - NOT a forex trading platform.",
    url: "https://tradeidea.co.in",
    siteName: "TradeIdea",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TradeIdea - Indian Stock Portfolio Tracker with Automated Alerts",
      },
    ],
    locale: "en_IN",
    type: "website",
    countryName: "India",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeIdea - Free Portfolio Tracker for Indian Stocks (NSE/BSE)",
    description: "Made in India 🇮🇳 Track equity portfolios automatically. Import from Zerodha/ICICI. Get alerts for entry, target, stop-loss. NOT a forex platform. 100% FREE.",
    images: ["/twitter-image"],
    creator: "@tradeidea_in",
  },
  verification: {
    google: "your-google-verification-code",
  },
  category: "Finance",
  classification: "Stock Market Portfolio Management",
  other: {
    "application-name": "TradeIdea",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "TradeIdea",
    "format-detection": "telephone=no",
    "theme-color": "#ff8c42",
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
            <SubscriptionProvider>
              <AccountsProvider>
                <SymbolsProvider>
                  <TradingProvider>
                    {children}
                  </TradingProvider>
                </SymbolsProvider>
              </AccountsProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
