"use client";

import Link from "next/link";
import { ArrowLeft, LayoutDashboard, BookOpen, Sparkles, MessageSquare, Trash2, Users, BarChart2, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminCoursesTab } from "./admin-courses-tab";
import { AdminUsersTab } from "./admin-users-tab";
import { AdminImportTab } from "./admin-import-tab";
import { AdminOverviewTab } from "./admin-overview-tab";
import { AdminFeedbackTab } from "./admin-feedback-tab";
import { AdminTrashTab } from "./admin-trash-tab";
import { AdminAnalyticsTab } from "./admin-analytics-tab";
import { AdminSettingsTab } from "./admin-settings-tab";

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
          Pilotez la plateforme : utilisateurs, formations, analytics, import IA — sans code.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-1">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5">
            <BarChart2 className="h-3.5 w-3.5" aria-hidden />
            Analytiques
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="formations" className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Formations
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Import IA
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            Réclamations
          </TabsTrigger>
          <TabsTrigger value="trash" className="flex items-center gap-1.5">
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Corbeille
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5" aria-hidden />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminOverviewTab />
        </TabsContent>

        <TabsContent value="analytics">
          <AdminAnalyticsTab />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsersTab />
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

        <TabsContent value="settings">
          <AdminSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
