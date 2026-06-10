"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import type { ResumeSummary } from "@/lib/types";
import { MiniResumePreview } from "@/components/resume/shared/mini-resume-preview";
import { MiniLetterPreview } from "@/components/resume/shared/mini-letter-preview";
import { updateResume } from "@/utils/actions/resumes/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, withBasePath } from "@/lib/utils";

interface ResumeGridCardProps {
  resume: ResumeSummary;
  variant: "cv" | "letter";
  href: string;
  jobTitle?: string;
  onPrefetch?: () => void;
}

export function ResumeGridCard({
  resume,
  variant,
  href,
  jobTitle,
  onPrefetch,
}: ResumeGridCardProps) {
  const router = useRouter();
  const [name, setName] = useState(resume.name);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(resume.name);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(resume.name);
    if (!editing) setDraft(resume.name);
  }, [resume.name, editing]);

  const subtitle =
    variant === "letter"
      ? jobTitle || resume.target_role
      : resume.target_role || "Sans intitulé";

  async function saveRename() {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error("Le nom ne peut pas être vide.");
      return;
    }
    if (trimmed === name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await updateResume(resume.id, { name: trimmed });
      setName(trimmed);
      setEditing(false);
      toast.success(variant === "letter" ? "Lettre renommée." : "CV renommé.");
      router.refresh();
    } catch {
      toast.error("Impossible de renommer. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDraft(name);
    setEditing(true);
  }

  function cancelEditing(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setDraft(name);
    setEditing(false);
  }

  const preview =
    variant === "cv" ? (
      <MiniResumePreview
        name={name}
        type={resume.is_base_resume ? "base" : "tailored"}
        target_role={resume.target_role}
        createdAt={resume.created_at}
        updatedAt={resume.updated_at}
        className="border border-[var(--digi-border)] rounded-lg"
      />
    ) : (
      <MiniLetterPreview
        name={name}
        target_role={resume.target_role}
        jobTitle={jobTitle}
        createdAt={resume.created_at}
        updatedAt={resume.updated_at}
        hasContent={Boolean(resume.has_cover_letter)}
        className="rounded-lg"
      />
    );

  return (
    <div className="group/card relative">
      {editing ? (
        <div className="block">{preview}</div>
      ) : (
        <Link
          href={withBasePath(href)}
          prefetch
          className="block"
          onMouseEnter={onPrefetch}
        >
          {preview}
        </Link>
      )}

      <div className="mt-1.5 space-y-0.5 px-0.5">
        {editing ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              void saveRename();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-8 text-xs flex-1 min-w-0"
              autoFocus
              disabled={saving}
              maxLength={120}
              aria-label={variant === "letter" ? "Nom de la lettre" : "Nom du CV"}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancelEditing();
              }}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 text-emerald-600"
              disabled={saving}
              aria-label="Enregistrer"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              disabled={saving}
              onClick={cancelEditing}
              aria-label="Annuler"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-1 min-w-0">
            <p
              className="flex-1 text-xs font-medium text-[var(--digi-navy)] truncate"
              title={name}
            >
              {name}
            </p>
            <button
              type="button"
              onClick={startEditing}
              className={cn(
                "shrink-0 p-1 rounded-md text-[var(--digi-muted)]",
                "opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 focus:opacity-100",
                "hover:bg-[var(--digi-surface)] hover:text-[var(--digi-navy)] transition-opacity"
              )}
              aria-label={variant === "letter" ? "Renommer la lettre" : "Renommer le CV"}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        )}
        <p className="text-xs text-[var(--digi-muted)] truncate">{subtitle}</p>
      </div>
    </div>
  );
}
