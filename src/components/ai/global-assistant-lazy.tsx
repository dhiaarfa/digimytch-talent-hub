"use client";

import dynamic from "next/dynamic";

const GlobalAssistant = dynamic(
  () =>
    import("@/components/ai/global-assistant").then((m) => ({
      default: m.GlobalAssistant,
    })),
  { ssr: false }
);

export function GlobalAssistantLazy({ isLoggedIn }: { isLoggedIn: boolean }) {
  return <GlobalAssistant isLoggedIn={isLoggedIn} />;
}
