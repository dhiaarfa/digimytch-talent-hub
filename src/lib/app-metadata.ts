import type { Metadata } from "next";

/** Métadonnées publiques — Digimytch Talent Hub uniquement */
export const digimytchMetadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"
  ),
  title: {
    default: "Digimytch Talent Hub — CV, matching & formations",
    template: "%s | Digimytch Talent Hub",
  },
  description:
    "Plateforme tunisienne d'insertion professionnelle : CV intelligent, matching emploi–profil, formations et suivi des candidatures.",
  applicationName: "Digimytch Talent Hub",
  keywords: [
    "Digimytch",
    "CV",
    "matching",
    "formations",
    "candidatures",
    "emploi",
    "Tunisie",
    "insertion professionnelle",
  ],
  authors: [{ name: "Mohamed Dhia Arfa" }],
  creator: "Mohamed Dhia Arfa — Digimytch",
  publisher: "Digimytch",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/digimytch-logo.png",
    shortcut: "/digimytch-logo.png",
    apple: "/digimytch-logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "Digimytch Talent Hub",
    title: "Digimytch Talent Hub",
    description:
      "Optimisez votre CV, évaluez vos offres, suivez vos candidatures et progressez avec des formations ciblées.",
    images: [
      {
        url: "/og.webp",
        width: 1200,
        height: 630,
        alt: "Digimytch Talent Hub",
      },
    ],
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Digimytch Talent Hub",
    description:
      "CV intelligent, matching et formations pour l'insertion professionnelle en Tunisie.",
    images: ["/og.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export function getRootMetadata(): Metadata {
  return digimytchMetadata;
}
