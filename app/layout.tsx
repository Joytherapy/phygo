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

  title: "Phygo — The AI Assistant Every Therapist Deserves",
  description:
    "Turn your voice into professional clinical notes, patient reports, WhatsApp follow-ups and PDF summaries in seconds.",
  keywords: [
    "clinical notes AI",
    "therapist software",
    "voice to notes",
    "physiotherapy software",
    "AI medical documentation",
  ],
  openGraph: {
    title: "Phygo — The AI Assistant Every Therapist Deserves",
    description:
      "Turn your voice into professional clinical notes, patient reports, WhatsApp follow-ups and PDF summaries in seconds.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Phygo — The AI Assistant Every Therapist Deserves",
    description:
      "Turn your voice into professional clinical notes, patient reports, WhatsApp follow-ups and PDF summaries in seconds.",
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
      "AI assistant for therapists, physiotherapists, and osteopaths that turns voice into clinical notes, patient reports, WhatsApp follow-ups, and PDF summaries.",
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