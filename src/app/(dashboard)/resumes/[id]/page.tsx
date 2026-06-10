import { cache } from "react";
import { redirect } from "next/navigation";
import { getResumeById } from "@/utils/actions/resumes/actions";
import { ResumeEditorLazy } from "@/components/resume/editor/resume-editor-lazy";
import { Metadata } from "next";
import { Resume } from "@/lib/types";
import {
  hasCoverLetterContent,
  normalizeCoverLetterContent,
} from "@/lib/cover-letter-html";

const getResumePageData = cache(async (resumeId: string) => {
  return getResumeById(resumeId);
});

function normalizeResumeData(resume: Resume): Resume {
  const rawContent =
    typeof resume.cover_letter?.content === "string"
      ? resume.cover_letter.content
      : "";
  const withLetter =
    hasCoverLetterContent(resume) || rawContent.trim().length > 0;

  return {
    ...resume,
    has_cover_letter: withLetter,
    ...(withLetter && rawContent
      ? {
          cover_letter: {
            ...resume.cover_letter,
            content: normalizeCoverLetterContent(rawContent),
            lastUpdated:
              (resume.cover_letter as { lastUpdated?: string })?.lastUpdated ??
              resume.updated_at,
          },
        }
      : {}),
    work_experience: resume.work_experience?.map(exp => ({
      ...exp,
      date: exp.date || ''
    })) || [],
    education: resume.education?.map(edu => ({
      ...edu,
      date: edu.date || ''
    })) || [],
    projects: resume.projects?.map(project => ({
      ...project,
      date: project.date || ''
    })) || [],
    document_settings: resume.document_settings || {
      document_font_size: 10,
      document_line_height: 1.5,
      document_margin_vertical: 36,
      document_margin_horizontal: 36,
      header_name_size: 24,
      header_name_bottom_spacing: 24,
      skills_margin_top: 2,
      skills_margin_bottom: 2,
      skills_margin_horizontal: 0,
      skills_item_spacing: 2,
      experience_margin_top: 2,
      experience_margin_bottom: 2,
      experience_margin_horizontal: 0,
      experience_item_spacing: 4,
      projects_margin_top: 2,
      projects_margin_bottom: 2,
      projects_margin_horizontal: 0,
      projects_item_spacing: 4,
      education_margin_top: 2,
      education_margin_bottom: 2,
      education_margin_horizontal: 0,
      education_item_spacing: 4
    }
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const { resume } = await getResumePageData(id);
    return {
      title: `${resume.name} | Digimytch Talent Hub`,
      description: `Édition du CV « ${resume.name} » — ${resume.target_role || "poste"}`,
    };
  } catch {
    return {
      title: 'Éditeur | Digimytch Talent Hub',
      description: 'Éditeur assisté par intelligence artificielle',
    };
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; mode?: string }>;
}) {
  try {
    const { id } = await params;
    const sp = await searchParams;
    const letterMode =
      sp.mode === "letter" || sp.tab === "letter";
    const defaultTab =
      sp.tab === "letter" ? "cover-letter" : "basic";

    const { resume: rawResume, profile, job } = await getResumePageData(id);
    const normalizedResume = normalizeResumeData(rawResume);

    if (letterMode) {
      if (normalizedResume.is_base_resume || !normalizedResume.job_id) {
        redirect(`/resumes/${id}`);
      }
    }

    return (
      <div
        className="h-full flex flex-col"
        data-page-title={normalizedResume.name}
        data-resume-type={normalizedResume.is_base_resume ? "Base Resume" : "Tailored Resume"}
      >
        <ResumeEditorLazy
          initialResume={normalizedResume}
          profile={profile}
          initialJob={job}
          defaultTab={letterMode ? "cover-letter" : defaultTab}
          editorMode={letterMode ? "letter" : "cv"}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'User not authenticated') {
      redirect("/auth/login");
    }
    redirect("/resumes");
  }
}
