"use server";

import { generateText, type CoreMessage } from "ai";
import type { AIConfig } from "@/lib/ai-models";
import { runTrackedAIRequest } from "@/lib/ai/run-tracked-request";
import {
  getDigimytchModelFallbackChain,
  selectDigimytchModelForTask,
} from "@/lib/digimytch-openrouter-models";
import {
  buildDebriefSystemPrompt,
  buildProfileBrief,
  buildRecruiterSystemPrompt,
  isProfileEmpty,
  type InterviewMessage,
  type InterviewScenario,
} from "@/lib/interview-simulator";
import type { Profile } from "@/lib/types";
import {
  DEMO_INTERVIEW_PROFILE,
  DEMO_INTERVIEW_PROFILE_BRIEF,
  DEMO_INTERVIEW_TARGET_ROLE,
} from "@/lib/interview-demo-profile";
import { logPromptInjectionAttempt } from "@/lib/ai/usage-ledger";
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
  isProfileEmpty: boolean;
  jobs: Array<{
    id: string;
    label: string;
    company: string;
    title: string;
  }>;
};

function resolveSimulationBrief(profile: Profile | null, demoMode?: boolean): string {
  if (demoMode || isProfileEmpty(profile)) {
    return DEMO_INTERVIEW_PROFILE_BRIEF;
  }
  return buildProfileBrief(profile!);
}

async function getPlanState() {
  const { plan, id } = await getSubscriptionPlan(true);
  // In Digimytch Talent Hub mode, all users have Pro access
  const { IS_DIGIMYTCH_TALENT_HUB } = await import("@/lib/digimytch-config");
  return { isPro: IS_DIGIMYTCH_TALENT_HUB || plan === "pro", userId: id ?? "" };
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

  const preferredModel =
    input.config?.model ?? selectDigimytchModelForTask("interview");
  const chain = getDigimytchModelFallbackChain(preferredModel);
  const maxTokens = input.maxTokens ?? 220;
  let lastError = "Réponse vide de l'assistant.";

  for (let i = 0; i < chain.length; i++) {
    const modelId = chain[i];
    try {
      const { text } = await runTrackedAIRequest(
        {
          route: i === 0 ? input.route : `${input.route}.model_fallback`,
          userId,
          isPro,
          config: {
            model: modelId,
            apiKeys: input.config?.apiKeys ?? [],
          },
        },
        (model) =>
          generateText({
            model,
            system: sanitizedSystem.text,
            messages: input.messages,
            maxTokens,
            maxRetries: 0,
            temperature: 0.7,
          })
      );

      const reply = text?.trim();
      if (reply) {
        return { ok: true, reply };
      }
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.message
          : "Impossible de générer la réponse pour le moment.";
    }
  }

  return { ok: false, error: lastError };
}

export async function getInterviewSetup(): Promise<InterviewSetupData> {
  const { profile: rawProfile, baseResumes } = await getDashboardData();
  const empty = isProfileEmpty(rawProfile);
  const profile = empty ? DEMO_INTERVIEW_PROFILE : rawProfile!;

  const defaultTargetRole = empty
    ? DEMO_INTERVIEW_TARGET_ROLE
    : baseResumes.find((r) => r.is_base_resume)?.target_role?.trim() ||
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

  const displayName = empty
    ? "Alex Martin (démo)"
    : rawProfile!.full_name?.trim() ||
      [rawProfile!.first_name, rawProfile!.last_name].filter(Boolean).join(" ").trim() ||
      "Candidat";

  return {
    profile,
    profileBrief: empty ? DEMO_INTERVIEW_PROFILE_BRIEF : buildProfileBrief(rawProfile!),
    defaultTargetRole,
    userDisplayName: displayName,
    userAvatarUrl: empty ? null : (rawProfile!.avatar_url ?? null),
    isProfileEmpty: empty,
    jobs,
  };
}

export async function startInterviewSimulation(input: {
  scenario: InterviewScenario;
  config?: AIConfig;
  demoMode?: boolean;
}): Promise<InterviewActionResult> {
  const { profile } = await getDashboardData();
  const profileBrief = resolveSimulationBrief(profile, input.demoMode);
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
    maxTokens: 220,
  });
}

export async function continueInterviewSimulation(input: {
  scenario: InterviewScenario;
  messages: InterviewMessage[];
  config?: AIConfig;
  demoMode?: boolean;
}): Promise<InterviewActionResult> {
  const { profile } = await getDashboardData();

  if (!input.messages.some((m) => m.role === "user")) {
    return { ok: false, error: "Aucune réponse candidat à traiter." };
  }

  const profileBrief = resolveSimulationBrief(profile, input.demoMode);
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
    maxTokens: 220,
  });
}

export async function finishInterviewSimulation(input: {
  scenario: InterviewScenario;
  messages: InterviewMessage[];
  config?: AIConfig;
  demoMode?: boolean;
}): Promise<InterviewActionResult> {
  const { profile } = await getDashboardData();
  const profileBrief = resolveSimulationBrief(profile, input.demoMode);
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
