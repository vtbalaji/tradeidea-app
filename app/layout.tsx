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
  title: "TradeIdea - Smart Portfolio Management Made Simple",
  description: "Track multiple portfolios, analyze stocks with real-time technical & fundamental data, import holdings from any broker (Zerodha, ICICI), and get instant portfolio health insights. Set smart exit criteria and share trading ideas with the community.",
  keywords: ["portfolio management", "stock analysis", "technical analysis", "fundamental analysis", "trading ideas", "CSV import", "Zerodha", "ICICI Direct", "portfolio tracking", "exit alerts", "multi-account portfolio"],
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: "TradeIdea - Smart Portfolio Management Made Simple",
    description: "Track multiple portfolios with instant health insights. Real-time technical & fundamental analysis, CSV import from any broker, smart exit alerts, and community-driven trading ideas.",
    url: "https://tradeidea.co.in",
    siteName: "TradeIdea",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TradeIdea - Smart Portfolio Management",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeIdea - Smart Portfolio Management",
    description: "Track portfolios, analyze stocks with real-time data, import from Zerodha/ICICI, get instant health insights & exit alerts",
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
