import { Metadata } from "next";
import { Background } from "@/components/landing/Background";
import FeatureHighlights from "@/components/landing/FeatureHighlights";
import { Hero } from "@/components/landing/Hero";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/layout/footer";
import { NavLinks } from "@/components/layout/nav-links";
import { Logo } from "@/components/ui/logo";
import { ErrorDialog } from "@/components/auth/error-dialog";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider";
import { DigimytchLoginView } from "@/components/auth/digimytch-login-view";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";

export const metadata: Metadata = {
  title: "Connexion | Digimytch Talent Hub",
  description: "Accédez à votre espace : CV, offres, formations et candidatures.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const showErrorDialog =
    params?.error === "email_confirmation" ||
    params?.error === "auth_code_missing";

  if (IS_DIGIMYTCH_TALENT_HUB) {
    return <DigimytchLoginView showErrorDialog={!!showErrorDialog} />;
  }

  return (
    <AuthDialogProvider>
      <main
        aria-label="Authentication"
        className="relative overflow-x-hidden selection:bg-violet-200/50"
      >
        <ErrorDialog isOpen={!!showErrorDialog} />

        <nav className="border-b border-gray-200 fixed top-0 w-full bg-white/95 z-[1000] transition-all duration-300 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Logo />
              <NavLinks />
            </div>
          </div>
        </nav>

        <Background />

        <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-24 flex flex-col justify-center pt-16">
          <Hero />
        </div>

        <section id="features" aria-labelledby="features-heading">
          <FeatureHighlights />
        </section>

        <FAQ />

        <Footer variant="static" />
      </main>
    </AuthDialogProvider>
  );
}
