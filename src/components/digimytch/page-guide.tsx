import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageGuideProps {
  title: string;
  description: string;
  steps?: string[];
  action?: { label: string; href: string };
}

export function PageGuide({ title, description, steps, action }: PageGuideProps) {
  return (
    <header className="mb-6 space-y-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--digi-dark)]">
          {title}
        </h1>
        <p className="text-[var(--digi-muted)] text-sm mt-1 max-w-2xl leading-relaxed">{description}</p>
      </div>
      {steps && steps.length > 0 && (
        <div className="rounded-xl border border-[var(--digi-border)] bg-white/80 p-4 text-sm">
          <p className="font-medium text-[var(--digi-dark)] flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-[var(--digi-accent)]" aria-hidden />
            Comment procéder
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[var(--digi-muted)]">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      )}
      {action && (
        <Button asChild size="sm" className="btn-digi-primary gap-1">
          <Link href={action.href}>
            {action.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
    </header>
  );
}
