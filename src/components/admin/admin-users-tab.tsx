"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Shield,
  UserX,
  UserCheck,
  Trash2,
  KeyRound,
  ShieldCheck,
  ShieldOff,
  Download,
  Search,
  RefreshCw,
  FileText,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  listAdminUsers,
  setAdminUserActive,
  setAdminUserRole,
  deleteAdminUser,
  resetAdminUserPassword,
  exportUsersCSV,
  type AdminUserRow,
} from "@/utils/actions/admin/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Filter = "all" | "admin" | "candidat" | "actif" | "inactif";

export function AdminUsersTab() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

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

  const filtered = users.filter((u) => {
    if (search && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "admin") return u.isAdmin;
    if (filter === "candidat") return !u.isAdmin;
    if (filter === "actif") return u.isActive;
    if (filter === "inactif") return !u.isActive;
    return true;
  });

  const withPending = async (
    userId: string,
    fn: () => Promise<{ ok: true } | { ok: false; error: string }>
  ) => {
    setPendingId(userId);
    const result = await fn();
    setPendingId(null);
    if (!result.ok) {
      toast.error("Action impossible", { description: result.error });
      return false;
    }
    return true;
  };

  const toggleActive = async (user: AdminUserRow) => {
    const nextActive = !user.isActive;
    const ok = await withPending(user.id, () => setAdminUserActive(user.id, nextActive));
    if (!ok) return;
    setUsers((prev) =>
      prev.map((r) => (r.id === user.id ? { ...r, isActive: nextActive } : r))
    );
    toast.success(nextActive ? "Compte réactivé" : "Compte désactivé", {
      description: user.email,
    });
  };

  const toggleRole = async (user: AdminUserRow) => {
    const nextAdmin = !user.isAdmin;
    const ok = await withPending(user.id, () => setAdminUserRole(user.id, nextAdmin));
    if (!ok) return;
    setUsers((prev) =>
      prev.map((r) => (r.id === user.id ? { ...r, isAdmin: nextAdmin } : r))
    );
    toast.success(nextAdmin ? "Promu administrateur" : "Rôle retiré (candidat)", {
      description: user.email,
    });
  };

  const handleResetPassword = async (user: AdminUserRow) => {
    const ok = await withPending(user.id, () => resetAdminUserPassword(user.id));
    if (!ok) return;
    toast.success("Email de réinitialisation envoyé", { description: user.email });
  };

  const handleDelete = async (user: AdminUserRow) => {
    const ok = await withPending(user.id, () => deleteAdminUser(user.id));
    if (!ok) return;
    setUsers((prev) => prev.filter((r) => r.id !== user.id));
    toast.success("Compte supprimé définitivement", { description: user.email });
  };

  const handleExportCSV = async () => {
    const result = await exportUsersCSV();
    if (!result.ok) {
      toast.error("Export impossible", { description: result.error });
      return;
    }
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `digimytch_users_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  const filterButtons: { value: Filter; label: string }[] = [
    { value: "all", label: "Tous" },
    { value: "admin", label: "Admins" },
    { value: "candidat", label: "Candidats" },
    { value: "actif", label: "Actifs" },
    { value: "inactif", label: "Inactifs" },
  ];

  return (
    <div className="mt-4 space-y-4">
      {/* Header card */}
      <div className="rounded-xl border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] p-4 flex flex-wrap justify-between items-start gap-3">
        <div>
          <h2 className="font-semibold text-[var(--digi-navy)] dark:text-[var(--digi-dark-fg)]">
            Gestion des comptes
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} compte{users.length > 1 ? "s" : ""} au total —{" "}
            {users.filter((u) => u.isActive).length} actif{users.filter((u) => u.isActive).length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadUsers()}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleExportCSV()}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <input
            type="search"
            placeholder="Rechercher par email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[var(--digi-border)] rounded-lg pl-9 pr-4 py-2 text-sm bg-white dark:bg-[var(--digi-card)] focus:outline-none focus:ring-1 focus:ring-[#030A8C]"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {filterButtons.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === value
                  ? "bg-[#030A8C] text-white"
                  : "bg-white border border-[var(--digi-border)] text-muted-foreground hover:text-[var(--digi-navy)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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

      {!loading && !error && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {search || filter !== "all" ? "Aucun résultat pour ce filtre." : "Aucun utilisateur."}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[var(--digi-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--digi-surface)] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Inscription</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Dernière connexion</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Données</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-t border-[var(--digi-border)] hover:bg-[var(--digi-surface)]/50 transition-colors">
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap hidden md:table-cell">
                    {user.lastSignIn
                      ? new Date(user.lastSignIn).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" aria-hidden />
                        {user.resumeCount ?? 0} CV
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" aria-hidden />
                        {user.jobCount ?? 0} offres
                      </span>
                    </div>
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
                        <><UserCheck className="h-3 w-3" aria-hidden />Actif</>
                      ) : (
                        <><UserX className="h-3 w-3" aria-hidden />Désactivé</>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {/* Activate/Deactivate */}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pendingId === user.id || user.isAdmin}
                        onClick={() => void toggleActive(user)}
                        title={user.isAdmin ? "Gérez via Supabase" : (user.isActive ? "Désactiver" : "Activer")}
                        className="h-7 px-2 text-xs"
                      >
                        {pendingId === user.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : user.isActive ? (
                          <UserX className="h-3.5 w-3.5" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                      </Button>

                      {/* Promote/Demote */}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pendingId === user.id}
                        onClick={() => void toggleRole(user)}
                        title={user.isAdmin ? "Retirer rôle admin" : "Promouvoir admin"}
                        className="h-7 px-2 text-xs"
                      >
                        {user.isAdmin ? (
                          <ShieldOff className="h-3.5 w-3.5 text-orange-600" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5 text-[#030A8C]" />
                        )}
                      </Button>

                      {/* Reset password */}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pendingId === user.id}
                        onClick={() => void handleResetPassword(user)}
                        title="Envoyer email de réinitialisation"
                        className="h-7 px-2 text-xs"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                      </Button>

                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pendingId === user.id}
                            title="Supprimer définitivement"
                            className="h-7 px-2 text-xs hover:border-red-300 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est <strong>irréversible</strong>. Le compte{" "}
                              <strong>{user.email}</strong> et toutes ses données (CV, offres,
                              entretiens) seront supprimés définitivement.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => void handleDelete(user)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer définitivement
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1"><UserX className="h-3 w-3" /> Activer / désactiver</span>
        <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-[#030A8C]" /> Promouvoir admin</span>
        <span className="flex items-center gap-1"><ShieldOff className="h-3 w-3 text-orange-600" /> Retirer rôle admin</span>
        <span className="flex items-center gap-1"><KeyRound className="h-3 w-3 text-amber-600" /> Réinitialiser mot de passe</span>
        <span className="flex items-center gap-1"><Trash2 className="h-3 w-3" /> Supprimer (irréversible)</span>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} sur {users.length} compte{users.length > 1 ? "s" : ""}
        {filter !== "all" || search ? " (filtrés)" : ""}
      </p>
    </div>
  );
}
