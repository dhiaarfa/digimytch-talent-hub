"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function TopProgressBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProgress(30);
    const t1 = setTimeout(() => {
      if (!cancelled) setProgress(70);
    }, 100);
    const t2 = setTimeout(() => {
      if (!cancelled) setProgress(100);
    }, 300);
    const t3 = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
        setProgress(0);
      }
    }, 600);
    const safety = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
        setProgress(0);
      }
    }, 4_000);
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(safety);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-gray-100">
      <div
        className="h-full bg-gradient-to-r from-[#030A8C] to-[#D10069] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
