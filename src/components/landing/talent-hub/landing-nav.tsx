"use client";

import { AppImage } from "@/components/ui/app-image";
import Link from "next/link";
import { PFE_TAGLINE } from "@/lib/digimytch-branding";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLanguage } from "@/lib/use-language";

export function LandingNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const { isEn } = useLanguage();
  const links = isEn
    ? [
        { href: "#how-it-works", label: "How it works" },
        { href: "#features", label: "Features" },
        { href: "#faq", label: "FAQ" },
      ]
    : [
        { href: "#how-it-works", label: "Comment ça marche" },
        { href: "#features", label: "Fonctionnalités" },
        { href: "#faq", label: "FAQ" },
      ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-black/25 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <AppImage src="/digimytch-logo.png" alt="Digimytch" width={32} height={32} className="rounded" priority />
          <span className="font-display font-bold text-white text-sm">
            Talent Hub
            <span className="block text-xs font-normal text-white/60">{PFE_TAGLINE}</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6" aria-label="Navigation">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-white/75 hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="text-xs border border-[#030A8C] text-[#030A8C] px-3 py-1.5 rounded-full hover:bg-[#030A8C] hover:text-white transition-colors"
            >
              Admin
            </Link>
          )}
          <LanguageToggle variant="on-dark" />
          <AuthDialog defaultTab="login">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              {isEn ? "Login" : "Connexion"}
            </Button>
          </AuthDialog>
        </div>
      </div>
    </header>
  );
}
