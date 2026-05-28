import { Info } from "lucide-react";
import { DEMO_BANNER_TEXT, PFE_TAGLINE } from "@/lib/digimytch-branding";

export function DemoBanner() {
  return (
    <div
      role="status"
      className="mb-6 flex gap-3 rounded-xl border border-[var(--digi-border)] bg-[var(--glass-background)] backdrop-blur-md px-4 py-3 text-sm text-[var(--digi-dark)]"
    >
      <Info className="h-5 w-5 shrink-0 text-[var(--digi-accent)]" aria-hidden />
      <p>
        <strong className="font-semibold">{PFE_TAGLINE}</strong>{" "}
        {DEMO_BANNER_TEXT}
      </p>
    </div>
  );
}
