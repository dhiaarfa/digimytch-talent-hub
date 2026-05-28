"use server";

import { createClient } from "@/utils/supabase/server";
import type { Course } from "@/lib/types";

export async function listCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Non authentifié");
  }

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    console.error("[listCourses]", error);
    throw new Error(
      "Impossible de charger le catalogue formations. Appliquez la migration Supabase (digimytch_courses_applications)."
    );
  }

  const rows = (data ?? []) as Course[];
  const byId = new Map<string, Course>();
  for (const course of rows) {
    if (!byId.has(course.id)) {
      byId.set(course.id, course);
    }
  }
  return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title, "fr"));
}
