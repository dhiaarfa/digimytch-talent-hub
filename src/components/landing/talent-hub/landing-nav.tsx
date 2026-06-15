"use client";

import { AppImage } from "@/components/ui/app-image";
import Link from "next/link";
import { PFE_TAGLINE } from "@/lib/digimytch-branding";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLanguage } from "@/lib/use-language";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function LandingNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const { isEn } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
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
        {/* Desktop nav links */}
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
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <nav
          className="md:hidden border-t border-white/10 bg-black/60 backdrop-blur-md"
          aria-label="Navigation mobile"
        >
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-white/80 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
