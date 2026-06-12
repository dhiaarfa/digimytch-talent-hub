import { Background } from "@/components/landing/Background";
import { Hero } from "@/components/landing/Hero";
import { Footer } from "@/components/layout/footer";
import { Logo } from "@/components/ui/logo";
import { ErrorDialog } from "@/components/auth/error-dialog";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider";
import Link from "next/link";

interface DigimytchLoginViewProps {
  showErrorDialog: boolean;
}

/** Connexion allégée (sans FAQ / FeatureHighlights) pour chargement plus rapide en démo PFE */
export function DigimytchLoginView({ showErrorDialog }: DigimytchLoginViewProps) {
  return (
    <AuthDialogProvider>
      <main
        aria-label="Connexion Digimytch Talent Hub"
        className="relative overflow-x-hidden selection:bg-violet-200/50 min-h-screen"
      >
        <ErrorDialog isOpen={showErrorDialog} />

        <nav className="border-b border-gray-200 fixed top-0 w-full bg-white/95 z-[1000] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Logo />
              <Link
                href="/"
                className="text-sm font-medium text-violet-800 hover:text-violet-950"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </nav>

        <Background />

        <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-24 flex flex-col justify-center pt-16 pb-12">
          <Hero />
          {process.env.NODE_ENV === "development" && (
            <p className="text-center text-sm text-muted-foreground mt-8 max-w-md mx-auto">
              Prototype PFE — compte démo :{" "}
              <span className="font-mono text-foreground">admin@admin.com</span> /{" "}
              <span className="font-mono text-foreground">Admin123</span>
            </p>
          )}
        </div>

        <Footer variant="static" />
      </main>
    </AuthDialogProvider>
  );
}
