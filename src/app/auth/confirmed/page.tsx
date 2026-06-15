import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Email confirmé — Digimytch Talent Hub",
};

export default function EmailConfirmedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-blue-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
        </div>

        {/* Brand */}
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-widest text-violet-600 uppercase">
            Digimytch Talent Hub
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Email confirmé !
          </h1>
        </div>

        {/* Message */}
        <p className="text-slate-600 leading-relaxed">
          Votre adresse email a bien été vérifiée. Votre compte est maintenant actif — vous pouvez vous connecter et accéder à la plateforme.
        </p>

        {/* CTA */}
        <div className="space-y-3 pt-2">
          <Button
            asChild
            className="w-full bg-gradient-to-r from-violet-600 via-blue-600 to-violet-600 hover:from-violet-500 hover:via-blue-500 hover:to-violet-500 text-white shadow-lg shadow-violet-500/20 transition-all duration-300"
          >
            <Link href="/home">Accéder à la plateforme</Link>
          </Button>

          <p className="text-xs text-slate-400">
            Vous serez automatiquement connecté si la session est active.
          </p>
        </div>
      </div>
    </main>
  );
}
