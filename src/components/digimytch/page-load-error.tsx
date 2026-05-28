import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PageLoadError({
  title,
  description,
  backHref = "/home",
  backLabel = "Retour au tableau de bord",
}: {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="max-w-lg mx-auto px-4 sm:px-6 py-16">
      <Card className="border-[var(--digi-border)]">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild className="btn-digi-primary">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">Paramètres</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
