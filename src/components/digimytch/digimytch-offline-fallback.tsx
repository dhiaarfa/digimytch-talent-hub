"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DigimytchOfflineFallback({
  title = "Connexion à la base impossible",
  description = "Supabase ne répond pas. Démarrez Docker puis exécutez npm run supabase:up dans le projet, ou vérifiez NEXT_PUBLIC_SUPABASE_URL dans .env.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-amber-300 bg-amber-50 px-6 py-8 text-center space-y-4">
      <h1 className="text-lg font-semibold text-amber-950">{title}</h1>
      <p className="text-sm text-amber-900/90">{description}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
        <Button
          type="button"
          size="sm"
          className="btn-digi-primary"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </Button>
      </div>
      <p className="text-xs text-amber-800/80 font-mono">
        npm run supabase:up · npm run dev
      </p>
    </div>
  );
}
