"use client";

import { PFE_TAGLINE } from "@/lib/digimytch-branding";
import { useLanguage } from "@/lib/use-language";
import { landingCopy } from "@/lib/landing-i18n";

export function TrustBanner() {
  const { lang } = useLanguage();
  const t = landingCopy(lang);
  return (
    <div className="border-y border-white/10 bg-black/20 py-4">
      <p className="text-center text-sm tracking-wide max-w-4xl mx-auto px-4 text-white/85">
        {PFE_TAGLINE} · {t.trustBanner}
      </p>
    </div>
  );
}
