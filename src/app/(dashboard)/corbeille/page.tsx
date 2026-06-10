import { TrashHub } from "@/components/trash/trash-hub";
import { PageGuide } from "@/components/digimytch/page-guide";
import { listUserTrash } from "@/utils/actions/trash/actions";

export default function CorbeillePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <PageGuide
        title="Corbeille"
        description="CV, offres et candidatures supprimés peuvent être restaurés pendant 30 jours, puis effacés définitivement."
      />
      <TrashHub loadItems={listUserTrash} />
    </main>
  );
}
