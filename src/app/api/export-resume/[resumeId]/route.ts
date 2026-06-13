import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";
import type { Resume } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

async function buildDocx(resume: Resume): Promise<Uint8Array> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
  } = await import("docx");

  const NAVY = "030A8C";
  const PINK = "D10069";
  const GRAY = "6B7280";

  const name = [resume.first_name, resume.last_name].filter(Boolean).join(" ") || "CV";
  const contact = [resume.email, resume.phone_number, resume.location, resume.linkedin_url]
    .filter(Boolean)
    .join(" | ");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sections: any[] = [];

  // Name
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: name, bold: true, size: 36, color: NAVY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    })
  );

  // Contact
  if (contact) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: contact, size: 18, color: GRAY })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  // Summary
  if (resume.professional_summary) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: "RÉSUMÉ PROFESSIONNEL", bold: true, size: 22, color: PINK })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: PINK } },
        spacing: { after: 80, before: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: resume.professional_summary, size: 20, color: GRAY })],
        spacing: { after: 200 },
      })
    );
  }

  // Work Experience
  if (resume.work_experience?.length) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: "EXPÉRIENCE PROFESSIONNELLE", bold: true, size: 22, color: PINK })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: PINK } },
        spacing: { after: 80, before: 200 },
      })
    );
    for (const exp of resume.work_experience) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.position || "Poste", bold: true, size: 22, color: NAVY }),
            new TextRun({ text: `  —  ${exp.company || ""}`, size: 20, color: GRAY }),
          ],
          spacing: { after: 40, before: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: exp.date || "", size: 18, color: GRAY, italics: true }),
            exp.location ? new TextRun({ text: `  ·  ${exp.location}`, size: 18, color: GRAY, italics: true }) : new TextRun(""),
          ],
          spacing: { after: 60 },
        })
      );
      for (const desc of exp.description || []) {
        if (desc?.trim()) {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${desc.replace(/^[•\-]\s*/, "")}`, size: 20 })],
              spacing: { after: 40 },
            })
          );
        }
      }
    }
  }

  // Education
  if (resume.education?.length) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: "FORMATION", bold: true, size: 22, color: PINK })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: PINK } },
        spacing: { after: 80, before: 200 },
      })
    );
    for (const edu of resume.education) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.degree || ""}${edu.field ? ` en ${edu.field}` : ""}`, bold: true, size: 22, color: NAVY }),
          ],
          spacing: { after: 40, before: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: edu.school || "", size: 20, color: GRAY }),
            edu.date ? new TextRun({ text: `  ·  ${edu.date}`, size: 18, color: GRAY, italics: true }) : new TextRun(""),
          ],
          spacing: { after: 60 },
        })
      );
      for (const ach of edu.achievements || []) {
        if (ach?.trim()) {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${ach}`, size: 20, color: GRAY })],
              spacing: { after: 40 },
            })
          );
        }
      }
    }
  }

  // Skills
  if (resume.skills?.length) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: "COMPÉTENCES", bold: true, size: 22, color: PINK })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: PINK } },
        spacing: { after: 80, before: 200 },
      })
    );
    for (const skill of resume.skills) {
      const items = skill.items?.join(", ") || "";
      if (skill.category || items) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${skill.category || "Compétences"} : `, bold: true, size: 20, color: NAVY }),
              new TextRun({ text: items, size: 20 }),
            ],
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  // Projects
  if (resume.projects?.length) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: "PROJETS", bold: true, size: 22, color: PINK })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: PINK } },
        spacing: { after: 80, before: 200 },
      })
    );
    for (const proj of resume.projects) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: proj.name || "Projet", bold: true, size: 22, color: NAVY }),
            proj.date ? new TextRun({ text: `  ·  ${proj.date}`, size: 18, color: GRAY, italics: true }) : new TextRun(""),
          ],
          spacing: { after: 40, before: 120 },
        })
      );
      for (const desc of Array.isArray(proj.description) ? proj.description : []) {
        if (desc?.trim()) {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${desc.replace(/^[•\-]\s*/, "")}`, size: 20 })],
              spacing: { after: 40 },
            })
          );
        }
      }
      if (proj.technologies?.length) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Technologies : ", bold: true, size: 18, color: GRAY }),
              new TextRun({ text: proj.technologies.join(", "), size: 18, color: GRAY }),
            ],
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [{ children: sections }],
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20 },
        },
      },
    },
  });

  return Packer.toBuffer(doc);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ resumeId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { resumeId } = await context.params;
    const { data: resume, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();

    if (error || !resume) {
      return Response.json({ error: "CV introuvable" }, { status: 404 });
    }

    const buffer = await buildDocx(resume as Resume);
    const filename = encodeURIComponent(
      `${resume.first_name || "CV"}_${resume.last_name || ""}_CV.docx`.replace(/\s+/g, "_")
    );

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (error) {
    logger.error("[api/export-resume/docx]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Génération du document impossible" },
      { status: 500 }
    );
  }
}
