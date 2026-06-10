"use client";

import dynamic from "next/dynamic";

const GlobalAssistant = dynamic(
  () =>
    import("@/components/ai/global-assistant").then((m) => ({
      default: m.GlobalAssistant,
    })),
  { ssr: false, loading: () => null }
);

export function GlobalAssistantLazy({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (!isLoggedIn) return null;
  return <GlobalAssistant isLoggedIn={isLoggedIn} />;
}
