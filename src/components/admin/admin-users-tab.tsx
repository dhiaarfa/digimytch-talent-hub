"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Shield, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  listAdminUsers,
  setAdminUserActive,
  type AdminUserRow,
} from "@/utils/actions/admin/actions";

export function AdminUsersTab() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listAdminUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const toggleActive = async (user: AdminUserRow) => {
    setPendingId(user.id);
    const nextActive = !user.isActive;
    const result = await setAdminUserActive(user.id, nextActive);
    setPendingId(null);

    if (!result.ok) {
      toast.error("Action impossible", { description: result.error });
      return;
    }

    setUsers((prev) =>
      prev.map((row) =>
        row.id === user.id ? { ...row, isActive: nextActive } : row
      )
    );
    toast.success(nextActive ? "Compte réactivé" : "Compte désactivé", {
      description: user.email,
    });
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-xl border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] p-4">
        <h2 className="font-semibold text-[var(--digi-navy)] dark:text-[var(--digi-dark-fg)]">
          Comptes candidats
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Consultez les utilisateurs inscrits et activez ou désactivez leur accès à la plateforme.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive text-center py-4" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && users.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Aucun utilisateur.</p>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[var(--digi-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--digi-surface)] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Inscription</th>
                <th className="px-4 py-3 font-medium">Dernière connexion</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-[var(--digi-border)]">
                  <td className="px-4 py-3 font-medium">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.lastSignIn
                      ? new Date(user.lastSignIn).toLocaleString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {user.isAdmin ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#030A8C]">
                        <Shield className="h-3.5 w-3.5" aria-hidden />
                        Admin
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Candidat</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <UserCheck className="h-3 w-3" aria-hidden />
                          Actif
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3" aria-hidden />
                          Désactivé
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant={user.isActive ? "outline" : "default"}
                      disabled={pendingId === user.id || user.isAdmin}
                      onClick={() => void toggleActive(user)}
                      title={
                        user.isAdmin
                          ? "Les comptes admin se gèrent via Supabase"
                          : undefined
                      }
                    >
                      {pendingId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : user.isActive ? (
                        "Désactiver"
                      ) : (
                        "Activer"
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {users.length} compte{users.length > 1 ? "s" : ""} — la désactivation bloque la connexion
        (ban Supabase Auth).
      </p>
    </div>
  );
}
