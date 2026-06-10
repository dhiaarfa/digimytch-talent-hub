export const TRASH_RETENTION_DAYS = 30;

export type TrashEntityType = "resume" | "job" | "application" | "course";

export function trashExpiryCutoff(): Date {
  const d = new Date();
  d.setDate(d.getDate() - TRASH_RETENTION_DAYS);
  return d;
}

export function isTrashRestorable(deletedAt: string | null | undefined): boolean {
  if (!deletedAt) return false;
  return new Date(deletedAt) >= trashExpiryCutoff();
}

export function daysUntilTrashPurge(deletedAt: string): number {
  const purgeAt = new Date(deletedAt);
  purgeAt.setDate(purgeAt.getDate() + TRASH_RETENTION_DAYS);
  const ms = purgeAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export const TRASH_ENTITY_LABELS: Record<TrashEntityType, { fr: string; en: string }> = {
  resume: { fr: "CV", en: "Resume" },
  job: { fr: "Offre analysée", en: "Job offer" },
  application: { fr: "Candidature", en: "Application" },
  course: { fr: "Formation", en: "Course" },
};
