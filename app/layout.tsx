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

  title: "Phygo — The Clinical Intelligence Platform for Physiotherapy",
  description:
    "Talk for 30 seconds. Phygo turns it into a structured clinical note, a reasoning trail, and an evidence-backed rehab plan — reviewed by you, delivered to your patient.",
  keywords: [
    "clinical intelligence platform",
    "physiotherapy AI",
    "clinical notes AI",
    "therapist software",
    "voice to notes",
    "physiotherapy software",
    "AI medical documentation",
  ],
  openGraph: {
    title: "Phygo — The Clinical Intelligence Platform for Physiotherapy",
    description:
      "Talk for 30 seconds. Phygo turns it into a structured clinical note, a reasoning trail, and an evidence-backed rehab plan — reviewed by you, delivered to your patient.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Phygo — The Clinical Intelligence Platform for Physiotherapy",
    description:
      "Talk for 30 seconds. Phygo turns it into a structured clinical note, a reasoning trail, and an evidence-backed rehab plan — reviewed by you, delivered to your patient.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Phygo",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Clinical intelligence platform for physiotherapists: turns a spoken or written session note into a structured clinical assessment, an evidence-backed rehab plan, and a program delivered to the patient.",
    offers: {
      "@type": "Offer",
      price: "19",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "120",
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
