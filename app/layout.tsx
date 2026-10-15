import type { Metadata } from "next";
import { Inter, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://phygo.app"),

  icons: {
    icon: "/image.png",
  },

  title: "PHYGO — The Clinical Workspace for Physiotherapy",
  description:
    "AI-drafted SOAP notes you review and approve, a clinical conditions library, 3D anatomy, exercise prescription and evidence tools — in one workspace for physiotherapists.",
  keywords: [
    "physiotherapy software",
    "physiotherapy clinical workspace",
    "SOAP notes physiotherapy",
    "AI clinical documentation",
    "clinical conditions library",
    "exercise prescription software",
    "rehabilitation protocols",
  ],
  openGraph: {
    title: "PHYGO — The Clinical Workspace for Physiotherapy",
    description:
      "AI-drafted SOAP notes you review and approve, a clinical conditions library, 3D anatomy, exercise prescription and evidence tools — in one workspace for physiotherapists.",
    type: "website",
    locale: "en_US",
    siteName: "PHYGO",
  },
  twitter: {
    card: "summary_large_image",
    title: "PHYGO — The Clinical Workspace for Physiotherapy",
    description:
      "AI-drafted SOAP notes you review and approve, a clinical conditions library, 3D anatomy, exercise prescription and evidence tools — in one workspace for physiotherapists.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No ratings or review counts here: PHYGO has no published reviews yet,
  // and search engines treat invented ratings as spam. The offer reflects
  // what a visitor can do today: create an account for free.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PHYGO",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    inLanguage: ["en", "it", "es", "fr"],
    description:
      "Clinical workspace for physiotherapists: AI-drafted SOAP notes and rehab plans reviewed by the clinician, a clinical conditions library, 3D anatomy, an exercise library and evidence tools.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free account",
    },
  };

  const themeInitScript = `
    (function() {
      try {
        var stored = window.localStorage.getItem("phygo-theme");
        var isDark = stored ? stored === "dark" : true;
        if (isDark) document.documentElement.classList.add("dark");
      } catch (e) {}
    })();
  `;

  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased bg-white text-ink dark:bg-ink dark:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
