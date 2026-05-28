"use server";

import { generateText, type CoreMessage } from "ai";
import type { AIConfig } from "@/lib/ai-models";
import {
  buildDebriefSystemPrompt,
  buildProfileBrief,
  buildRecruiterSystemPrompt,
  type InterviewMessage,
  type InterviewScenario,
} from "@/lib/interview-simulator";
import type { Profile } from "@/lib/types";
import {
  finishAIUsageRequest,
  logPromptInjectionAttempt,
  startAIUsageRequest,
} from "@/lib/ai/usage-ledger";
import { trimInterviewMessages } from "@/lib/interview-messages";
import { sanitizeForPrompt } from "@/lib/prompt-security";
import { getDashboardData } from "@/utils/actions";
import { getJobsWithMatchScores } from "@/utils/actions/digimytch/actions";
import { getSubscriptionPlan } from "@/utils/actions/stripe/actions";
import { createClient } from "@/utils/supabase/server";

export type InterviewActionResult =
  | { ok: true; reply: string }
  | { ok: false; error: string };

export type InterviewSetupData = {
  profile: Profile;
  profileBrief: string;
  defaultTargetRole: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  jobs: Array<{
    id: string;
    label: string;
    company: string;
    title: string;
  }>;
};

async function getPlanState() {
  const { plan, id } = await getSubscriptionPlan(true);
  return { isPro: plan === "pro", userId: id ?? "" };
}

async function runInterviewAI(input: {
  route: string;
  system: string;
  messages: CoreMessage[];
  config?: AIConfig;
  maxTokens?: number;
}): Promise<InterviewActionResult> {
  const { isPro, userId } = await getPlanState();
  const sanitizedSystem = sanitizeForPrompt(input.system);
  if (sanitizedSystem.detected || sanitizedSystem.wasTrimmed) {
    await logPromptInjectionAttempt({
      userId,
      route: input.route,
      details: `removed=${sanitizedSystem.removedFragments},trimmed=${sanitizedSystem.wasTrimmed}`,
    });
  }

  let usageEventId: string;
  let model;
  try {
    const started = await startAIUsageRequest({
      route: input.route,
      userId,
      isPro,
      config: input.config,
    });
    usageEventId = started.usageEventId;
    model = started.model;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Accès IA indisponible.";
    return { ok: false, error: message };
  }

  try {
    const { text, usage } = await generateText({
      model,
      system: sanitizedSystem.text,
      messages: input.messages,
      maxTokens: input.maxTokens ?? 500,
    });

    await finishAIUsageRequest({
      usageEventId,
      status: "succeeded",
      usage,
    });

    const reply = text?.trim();
    if (!reply) {
      return { ok: false, error: "Réponse vide de l'assistant." };
    }
    return { ok: true, reply };
  } catch (error) {
    await finishAIUsageRequest({
      usageEventId,
      status: "failed",
      errorCode: error instanceof Error ? error.message : "ai_failed",
    });
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de générer la réponse pour le moment.";
    return { ok: false, error: message };
  }
}

export async function getInterviewSetup(): Promise<InterviewSetupData> {
  const { profile, baseResumes } = await getDashboardData();
  if (!profile) {
    throw new Error("Profil introuvable");
  }

  const defaultTargetRole =
    baseResumes.find((r) => r.is_base_resume)?.target_role?.trim() ||
    "Développeur / poste visé à préciser";

  let jobs: InterviewSetupData["jobs"] = [];
  try {
    const { jobsWithMatch } = await getJobsWithMatchScores();
    jobs = jobsWithMatch.map(({ job }) => ({
      id: job.id,
      label: `${job.position_title} — ${job.company_name}`,
      company: job.company_name || "",
      title: job.position_title || "",
    }));
  } catch {
    jobs = [];
  }

  const displayName =
    profile.full_name?.trim() ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    "Candidat";

  return {
    profile,
    profileBrief: buildProfileBrief(profile),
    defaultTargetRole,
    userDisplayName: displayName,
    userAvatarUrl: profile.avatar_url ?? null,
    jobs,
  };
}

export async function startInterviewSimulation(input: {
  scenario: InterviewScenario;
  config?: AIConfig;
}): Promise<InterviewActionResult> {
  const { profile } = await getDashboardData();
  if (!profile) {
    return { ok: false, error: "Complétez votre profil avant la simulation." };
  }

  const profileBrief = buildProfileBrief(profile);
  const system = buildRecruiterSystemPrompt(profileBrief, input.scenario);

  return runInterviewAI({
    route: "digimytch/interview-start",
    system,
    messages: [
      {
        role: "user",
        content:
          "Commence : une phrase d'accueil très courte (max 12 mots) puis UNE seule question courte (max 25 mots) adaptée à mon profil.",
      },
    ],
    config: input.config,
    maxTokens: 120,
  });
}

export async function continueInterviewSimulation(input: {
  scenario: InterviewScenario;
  messages: InterviewMessage[];
  config?: AIConfig;
}): Promise<InterviewActionResult> {
  const { profile } = await getDashboardData();
  if (!profile) {
    return { ok: false, error: "Profil introuvable." };
  }

  if (!input.messages.some((m) => m.role === "user")) {
    return { ok: false, error: "Aucune réponse candidat à traiter." };
  }

  const profileBrief = buildProfileBrief(profile);
  const system = buildRecruiterSystemPrompt(profileBrief, input.scenario);

  const trimmed = trimInterviewMessages(input.messages);
  const coreMessages: CoreMessage[] = trimmed.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return runInterviewAI({
    route: "digimytch/interview-turn",
    system,
    messages: coreMessages,
    config: input.config,
    maxTokens: 120,
  });
}

export async function finishInterviewSimulation(input: {
  scenario: InterviewScenario;
  messages: InterviewMessage[];
  config?: AIConfig;
}): Promise<InterviewActionResult> {
  const { profile } = await getDashboardData();
  if (!profile) {
    return { ok: false, error: "Profil introuvable." };
  }

  const profileBrief = buildProfileBrief(profile);
  const system = buildDebriefSystemPrompt(profileBrief, input.scenario);

  const transcript = input.messages
    .map((m) => `${m.role === "user" ? "Candidat" : "Recruteur"} : ${m.content}`)
    .join("\n\n");

  return runInterviewAI({
    route: "digimytch/interview-debrief",
    system,
    messages: [
      {
        role: "user",
        content: `Voici la transcription complète de la simulation :\n\n${transcript}\n\nProduis le débrief structuré.`,
      },
    ],
    config: input.config,
    maxTokens: 500,
  });
}

/** Charge une offre pour pré-remplir le scénario (optionnel). */
export async function getInterviewScenarioForJob(
  jobId: string
): Promise<InterviewScenario | null> {
  const supabase = await createClient();
  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, position_title, company_name")
    .eq("id", jobId)
    .single();

  if (error || !job) return null;

  return {
    targetRole: job.position_title || "Poste",
    company: job.company_name || undefined,
    jobTitle: job.position_title || undefined,
    jobId: job.id,
  };
}
