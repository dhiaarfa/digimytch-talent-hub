"use client";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020659]/5 via-sky-50/40 to-[#D10069]/5 flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--digi-navy)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;accueil
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-[var(--digi-navy)]/8 border border-[var(--digi-navy)]/15 flex items-center justify-center mb-4">
              <KeyRound className="w-5 h-5 text-[var(--digi-navy)]" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Mot de passe oublié ?</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Saisissez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
