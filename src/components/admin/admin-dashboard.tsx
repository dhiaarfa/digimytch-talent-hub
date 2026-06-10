"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminCoursesTab } from "./admin-courses-tab";
import { AdminUsersTab } from "./admin-users-tab";
import { AdminImportTab } from "./admin-import-tab";
import { AdminOverviewTab } from "./admin-overview-tab";
import { AdminFeedbackTab } from "./admin-feedback-tab";
import { AdminTrashTab } from "./admin-trash-tab";

export function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-6 space-y-2">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-[var(--digi-navy)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-[var(--digi-navy)] dark:text-[var(--digi-dark-fg)]">
          Administration Digimytch
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tableau de bord, formations, utilisateurs et import IA — sans code.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="formations">Formations</TabsTrigger>
          <TabsTrigger value="import">Import IA</TabsTrigger>
          <TabsTrigger value="feedback">Réclamations</TabsTrigger>
          <TabsTrigger value="trash">Corbeille</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminOverviewTab />
        </TabsContent>

        <TabsContent value="formations">
          <AdminCoursesTab />
        </TabsContent>

        <TabsContent value="import">
          <AdminImportTab />
        </TabsContent>

        <TabsContent value="feedback">
          <AdminFeedbackTab />
        </TabsContent>

        <TabsContent value="trash">
          <AdminTrashTab />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
