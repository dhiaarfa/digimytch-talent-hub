import { ScrollButtons } from "@/components/ui/scroll-to-top";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { DigimytchModelMigrator } from "@/components/digimytch/digimytch-model-migrator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-0 flex-1 w-full relative flex flex-col pb-12">
      <div className="flex-1 min-h-0">{children}</div>
      {IS_DIGIMYTCH_TALENT_HUB && <DigimytchModelMigrator />}
      <ScrollButtons variant="dashboard" />
    </div>
  );
}
