'use client'

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useResumeLabels } from "@/lib/resume-labels";
import { resetBrowserClient } from "@/utils/supabase/client";
import { clearBrowserSupabaseSession } from "@/lib/supabase-browser-session";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LogoutButtonProps {
  className?: string;
  /** Sidebar étroite : icône seule + infobulle */
  iconOnly?: boolean;
  /** Libellé personnalisé (ex. menu sidebar Digimytch) */
  label?: string;
}

export function LogoutButton({ className, iconOnly = false, label }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const L = useResumeLabels();

  const handleLogout = () => {
    setIsLoading(true);
    clearBrowserSupabaseSession();
    resetBrowserClient();
    window.location.assign("/auth/signout");
  };

  const button = (
    <Button
      variant="ghost"
      type="button"
      title={iconOnly ? L.logout : undefined}
      className={cn(
        "flex items-center gap-1 min-w-0 shrink",
        iconOnly
          ? "h-8 w-8 p-0 text-[var(--digi-muted)] hover:text-[var(--digi-navy)]"
          : "px-2 py-1 text-xs font-medium text-purple-600/80 hover:text-purple-800 max-w-full",
        className
      )}
      onClick={handleLogout}
      disabled={isLoading}
    >
      <LogOut className={cn("shrink-0", iconOnly ? "h-4 w-4" : "h-3.5 w-3.5", isLoading && "animate-spin")} />
      {!iconOnly && (
        <span className="truncate">{isLoading ? L.signingOut : (label ?? L.logout)}</span>
      )}
    </Button>
  );

  if (iconOnly) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex relative z-20 pointer-events-auto">{button}</span>
          </TooltipTrigger>
          <TooltipContent side="top">{L.logout}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
