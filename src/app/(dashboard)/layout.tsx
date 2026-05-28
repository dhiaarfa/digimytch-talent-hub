import { ScrollButtons } from "@/components/ui/scroll-to-top";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-0 flex-1 w-full relative">
      {children}
      <ScrollButtons />
    </div>
  );
}