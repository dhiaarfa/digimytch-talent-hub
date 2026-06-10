import { z } from "zod";

const atsKeywordSectionSchema = z.object({
  score: z.number().min(0).max(100),
  present: z.array(z.string()).default([]),
  missing: z.array(z.string()).default([]),
});

const atsEducationSectionSchema = z.object({
  score: z.number().min(0).max(100),
  missing: z.array(z.string()).default([]),
});

export const atsGapAnalysisSchema = z.object({
  overall_ats_score: z.number().min(0).max(100),
  sections: z.object({
    summary: atsKeywordSectionSchema,
    experience: atsKeywordSectionSchema,
    skills: atsKeywordSectionSchema,
    education: atsEducationSectionSchema,
  }),
  critical_missing: z.array(z.string()).default([]),
  quick_wins: z.array(z.string()).max(5).default([]),
});

export type AtsGapAnalysis = z.infer<typeof atsGapAnalysisSchema>;

export const atsGapCvContentSchema = z
  .object({
    target_role: z.string().optional(),
    professional_summary: z.string().optional(),
    work_experience: z.array(z.record(z.unknown())).optional(),
    education: z.array(z.record(z.unknown())).optional(),
    skills: z.array(z.record(z.unknown())).optional(),
    projects: z.array(z.record(z.unknown())).optional(),
    certifications: z.array(z.record(z.unknown())).optional(),
  })
  .passthrough();

export const atsGapRequestSchema = z.object({
  cv_content: atsGapCvContentSchema,
  job_description: z.string().min(40, "Collez au moins 40 caractères d'annonce."),
  model: z.string().optional(),
  apiKeys: z
    .array(
      z.object({
        service: z.string(),
        key: z.string(),
        addedAt: z.string(),
      })
    )
    .optional(),
});

export type AtsGapRequest = z.infer<typeof atsGapRequestSchema>;
