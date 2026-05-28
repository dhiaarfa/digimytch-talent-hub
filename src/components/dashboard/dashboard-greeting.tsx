"use client";

import { useEffect, useState } from "react";
import { getGreeting } from "@/lib/utils";

interface DashboardGreetingProps {
  firstName?: string | null;
}

/** Time-based greeting rendered after mount to avoid server/client timezone hydration drift. */
export function DashboardGreeting({ firstName }: DashboardGreetingProps) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const name = firstName?.trim();
    setLabel(`${getGreeting()}${name ? `, ${name}` : ""}`);
  }, [firstName]);

  return (
    <h1 className="text-2xl font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent min-h-[2rem]">
      {label || "\u00a0"}
    </h1>
  );
}
