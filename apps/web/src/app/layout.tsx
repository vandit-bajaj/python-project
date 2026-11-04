import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { APP_CONTENT } from "@/content";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" }
  ]
};

export const metadata: Metadata = {
  title: `${APP_CONTENT.common.appName} — ${APP_CONTENT.common.tagline}`,
  description: APP_CONTENT.landing.heroSubtitle,
  robots: {
    index: false,
    follow: false
  }
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="safe-area-container">
          {children}
        </div>
      </body>
    </html>
  );
}
