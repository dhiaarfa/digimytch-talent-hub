"use client";

import { PFE_TAGLINE } from "@/lib/digimytch-branding";
import { useLanguage } from "@/lib/use-language";

export function TrustBanner() {
  const { lang } = useLanguage();
  const platforms = ["LinkedIn", "Rekrute.com", "Indeed", "Emploi.net", "Bayt.com"];
  return (
    <div className="border-y border-white/10 bg-black/20 py-5">
      <p className="text-center text-xs font-medium tracking-widest uppercase text-white/40 mb-3 px-4">
        {lang === "en" ? "Import job offers from" : "Importez des offres depuis"}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 px-4">
        {platforms.map((p) => (
          <span
            key={p}
            className="px-3 py-1 rounded-full bg-white/8 border border-white/12 text-white/65 text-xs font-medium hover:bg-white/15 hover:text-white/90 transition-colors duration-200"
          >
            {p}
          </span>
        ))}
        <span className="px-3 py-1 rounded-full bg-white/8 border border-white/12 text-white/40 text-xs font-medium">
          + {lang === "en" ? "any website" : "tout site"}
        </span>
      </div>
      <p className="text-center text-xs text-white/30 mt-3 px-4">{PFE_TAGLINE}</p>
    </div>
  );
}
