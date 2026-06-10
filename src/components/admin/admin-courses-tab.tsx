"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Course } from "@/lib/types";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  type AdminCourseInput,
} from "@/utils/actions/admin/actions";
import { ViewModeToggle, type ViewMode } from "@/components/ui/view-mode-toggle";
import { resolveCourseImage } from "@/lib/card-images";
import { EntityCardImage } from "@/components/ui/entity-card-image";

const emptyForm = {
  title: "",
  provider: "",
  level: "Débutant",
  skills_targeted: "",
  url: "",
};

export function AdminCoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const toPayload = (): AdminCourseInput => ({
    title: form.title,
    provider: form.provider,
    level: form.level,
    skills_targeted: form.skills_targeted
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    url: form.url || null,
  });

  const handleSave = async () => {
    if (!form.title.trim() || !form.provider.trim()) {
      toast.error("Titre et organisme sont obligatoires.");
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload();
      const result = editingId
        ? await updateCourse(editingId, payload)
        : await createCourse(payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(editingId ? "Formation mise à jour" : "Formation ajoutée");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadCourses();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer « ${title} » ?`)) return;
    const result = await deleteCourse(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Formation supprimée");
    await loadCourses();
  };

  const startEdit = (course: Course) => {
    setForm({
      title: course.title,
      provider: course.provider,
      level: course.level,
      skills_targeted: (course.skills_targeted || []).join(", "),
      url: course.url ?? "",
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {loading ? "Chargement…" : `${courses.length} formations dans le catalogue`}
        </p>
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm(emptyForm);
          }}
          className="flex items-center gap-2 bg-[#030A8C] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#030A8C]/90"
        >
          <Plus size={16} aria-hidden />
          Ajouter une formation
        </button>
      </div>

      {showForm && (
        <div className="border rounded-xl p-5 bg-gray-50 space-y-3">
          <h3 className="font-semibold">
            {editingId ? "Modifier la formation" : "Nouvelle formation"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Titre *</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm mt-1"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex. React.js avancé — hooks & performance"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Organisme *</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm mt-1"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                placeholder="Ex. Digimytch Academy"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Niveau</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm mt-1"
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
              >
                <option>Débutant</option>
                <option>Intermédiaire</option>
                <option>Avancé</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">
                Lien d&apos;inscription
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm mt-1"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600">
                Compétences ciblées (séparées par virgule)
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm mt-1"
                value={form.skills_targeted}
                onChange={(e) =>
                  setForm({ ...form, skills_targeted: e.target.value })
                }
                placeholder="react, hooks, typescript, performance"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex items-center gap-2 bg-[#D10069] text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" aria-hidden />
              ) : (
                <Save size={14} aria-hidden />
              )}
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="px-4 py-2 border rounded-lg text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-2">
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      <div
        className={
          viewMode === "grid"
            ? "grid sm:grid-cols-2 gap-3"
            : "space-y-2"
        }
      >
        {courses.map((course) => {
          const img = resolveCourseImage(course);
          return (
          <div
            key={course.id}
            className={
              viewMode === "grid"
                ? "flex flex-col border rounded-lg overflow-hidden bg-white dark:bg-[var(--digi-card)] hover:shadow-sm"
                : "flex items-center justify-between border rounded-lg p-3 bg-white dark:bg-[var(--digi-card)] hover:shadow-sm gap-3"
            }
          >
            {viewMode === "grid" ? (
              <EntityCardImage src={img.src} alt={img.alt} categoryHint={img.categoryHint} variant="course" />
            ) : (
              <EntityCardImage src={img.src} alt={img.alt} categoryHint={img.categoryHint} variant="course" compact />
            )}
            <div className={viewMode === "grid" ? "p-3 min-w-0" : "min-w-0 flex-1"}>
              <p className="font-medium text-sm truncate">{course.title}</p>
              <p className="text-xs text-muted-foreground">
                {course.provider} · {course.level}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => startEdit(course)}
                className="p-1.5 hover:bg-gray-100 rounded"
                aria-label="Modifier"
              >
                <Pencil size={14} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(course.id, course.title)}
                className="p-1.5 hover:bg-red-50 rounded text-red-500"
                aria-label="Supprimer"
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}
