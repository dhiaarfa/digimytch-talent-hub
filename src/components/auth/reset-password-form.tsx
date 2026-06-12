"use client";
import { logger } from "@/lib/logger";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { resetPasswordForEmail } from "@/app/auth/login/actions";

interface FormState {
  error?: string;
  success?: boolean;
}

export function ResetPasswordForm() {
  const [formState, setFormState] = useState<FormState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState({});
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      const result = await resetPasswordForEmail(formData);

      if (!result.success) {
        setFormState({ error: result.error || "Impossible d'envoyer le lien. Vérifiez l'adresse e-mail." });
        return;
      }

      setEmail("");
      setFormState({ success: true });
    } catch (error: unknown) {
      logger.error("Password reset error:", error);
      setFormState({ error: "Une erreur inattendue s'est produite. Réessayez." });
    } finally {
      setIsLoading(false);
    }
  }

  if (formState.success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">E-mail envoyé !</p>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Si cette adresse est associée à un compte, vous recevrez un lien de réinitialisation dans quelques instants.
            Pensez à vérifier vos spams.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formState.error && (
        <Alert variant="destructive" className="bg-red-50/50 text-red-900 border-red-200/50">
          <AlertDescription>{formState.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="reset-email" className="text-sm font-medium text-slate-700">
          Adresse e-mail
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="reset-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
            autoFocus
            autoComplete="email"
            className="pl-10 border-slate-200 focus:border-[var(--digi-navy)] focus:ring-[var(--digi-navy)]/20"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[var(--digi-navy)] hover:bg-[var(--digi-navy)]/90 text-white font-semibold rounded-lg h-10 transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Envoi en cours…
          </>
        ) : (
          "Envoyer le lien de réinitialisation"
        )}
      </Button>
    </form>
  );
}
