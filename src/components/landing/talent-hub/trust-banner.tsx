import { PFE_TAGLINE } from "@/lib/digimytch-branding";

export function TrustBanner() {
  return (
    <div className="border-y border-white/10 bg-black/20 py-4">
      <p className="text-center text-sm tracking-wide max-w-4xl mx-auto px-4 text-white/85">
        {PFE_TAGLINE} · Données locales · Environnement de démonstration
      </p>
    </div>
  );
}
