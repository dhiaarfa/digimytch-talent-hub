"use client";
import { logger } from "@/lib/logger";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Loader2, CheckCircle2, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
      }
    };
    checkSession();
  }, [router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);
    setIsLoading(true);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2500);
    } catch (error) {
      setError("Une erreur inattendue s'est produite.");
      logger.error("Password update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020659]/5 via-sky-50/40 to-[#D10069]/5 flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#020659]/8 border border-[#020659]/15 flex items-center justify-center mb-4">
              <KeyRound className="w-5 h-5 text-[#020659]" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Nouveau mot de passe</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Choisissez un mot de passe sécurisé d&apos;au moins 6 caractères.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-50/50 text-red-900 border-red-200/50">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Mot de passe mis à jour !</p>
                <p className="text-sm text-slate-500 mt-1">
                  Redirection en cours…
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium text-slate-700">
                  Nouveau mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="new-password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoFocus
                    autoComplete="new-password"
                    className="pl-10 border-slate-200 focus:border-[#020659] focus:ring-[#020659]/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="pl-10 border-slate-200 focus:border-[#020659] focus:ring-[#020659]/20"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#020659] hover:bg-[#020659]/90 text-white font-semibold rounded-lg h-10 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour…
                  </>
                ) : (
                  "Mettre à jour le mot de passe"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
