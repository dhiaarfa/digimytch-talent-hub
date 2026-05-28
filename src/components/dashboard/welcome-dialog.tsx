'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useState, useEffect } from "react";

interface WelcomeDialogProps {
  isOpen: boolean;
}

export function WelcomeDialog({ isOpen: initialIsOpen }: WelcomeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(initialIsOpen);
  }, [initialIsOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Bienvenue sur Digimytch Talent Hub
          </DialogTitle>
        </DialogHeader>

        <div className="pt-4 space-y-6">
          <h3 className="font-medium text-foreground">Pour bien démarrer :</h3>
          <ul className="space-y-4 list-none p-0 m-0">
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center text-sm font-semibold text-teal-700">
                1
              </span>
              <p className="text-muted-foreground pt-1">
                Complétez votre profil : expériences, formation et compétences
              </p>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-sm font-semibold text-purple-700">
                2
              </span>
              <p className="text-muted-foreground pt-1">
                Créez un ou plusieurs CV de base selon vos objectifs
              </p>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-sm font-semibold text-rose-700">
                3
              </span>
              <p className="text-muted-foreground pt-1">
                Affinez vos CV pour des offres précises, suivez vos candidatures et les formations
                recommandées
              </p>
            </li>
          </ul>
          <div className="pt-2 space-y-2">
            <Link href="/profile">
              <Button className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                Compléter mon profil
              </Button>
            </Link>
            <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
              Plus tard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
