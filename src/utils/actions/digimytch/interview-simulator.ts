"use server";

import { generateText, type CoreMessage } from "ai";
import type { AIConfig } from "@/lib/ai-models";
import { runTrackedAIRequest } from "@/lib/ai/run-tracked-request";
import {
  getInterviewModelFallbackChain,
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


/**
 * Strip CoT from a debrief (multi-paragraph). Only removes obvious reasoning
 * lines at the TOP of the response, preserving the full structured content.
 */
function cleanDebriefReply(raw: string): string {
  const lines = raw.trim().split(/\r?\n/);
  // Drop leading lines that look like reasoning (until we hit a real markdown title or French sentence)
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    // Stop skipping once we hit a real content line
    if (l.startsWith("**") || l.startsWith("#") || /^[A-ZÀ-Ü]/.test(l)) break;
    // Skip if it looks like reasoning
    if (
      /\(\d+\)/.test(l) ||
      /^(Count|Let[''`s]|Step \d|Voici|Je dois|Calculons|First|Greeting|Let me)/i.test(l) ||
      /\bcount\b.*\bword|\bword.*\bcount/i.test(l)
    ) {
      start = i + 1;
    }
  }
  return lines.slice(start).join("\n").trim() || raw.trim();
}

/**
 * Strip chain-of-thought / reasoning leakage from a model that thinks aloud.
 *
 * Some free OpenRouter models (thinking models) output their internal reasoning
 * as plain text before the actual question. This scrubs it so only the final
 * question reaches the user.
 */
function cleanInterviewReply(raw: string): string {
  const text = raw.trim();

  // 1. If a quoted question exists anywhere, prefer it (most reliable signal)
  const quoteMatch = text.match(/["\u00ab\u00bb\u201c\u201d]([^"\u00ab\u00bb\u201c\u201d]{8,200})["«»“”]/u);
  if (quoteMatch) return quoteMatch[1].trim();

  // 2. Split into lines and drop reasoning lines
  const lines = text.split(/\r?\n/);
  const clean = lines.filter((line) => {
    const l = line.trim();
    if (!l) return false;
    // Word-counting patterns like "Bonjour(1) Alex,(2)"
    if (/\(\d+\)/.test(l)) return false;
    // English/French reasoning starters
    if (/^(Count|Let[''`]s|Step \d|Voici|Vérifions|Je dois|Je vais|Calculons|D[''`]abord|Ensuite|Maintenant|Total\s*:|Mots\s*:|Résultat|First phrase|Greeting|Max \d|Let me|Let's)/i.test(l)) return false;
    // Lines that are clearly meta-commentary
    if (/\bcount\b.*\bword|\bword.*\bcount/i.test(l)) return false;
    // Short filler lines (single isolated words, just punctuation)
    if (l.length < 4 && !/[?!]/.test(l)) return false;
    return true;
  });

  if (clean.length === 0) {
    // All lines were stripped — last resort: take the last sentence of the raw text
    const sentences = text.match(/[^.!?]+[.!?]+/g);
    return sentences ? sentences[sentences.length - 1].trim() : text;
  }

  // The last surviving line is most likely the actual question
  let result = clean[clean.length - 1].trim();
  // Strip residual prefixes like "Now question:", "Ma question :", "Question :", etc.
  result = result.replace(/^(now question|ma question|question|réponse|recruteur)\s*:\s*/i, "");
  return result.trim() || text;
}

async function runInterviewAI(input: {
  route: string;
  system: string;
  messages: CoreMessage[];
  config?: AIConfig;
  maxTokens?: number;
  cleanFn?: (raw: string) => string;
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
  // Use interview-specific chain (no thinking/reasoning models that leak CoT)
  const chain = getInterviewModelFallbackChain(preferredModel);
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
        const cleanedReply = (input.cleanFn ?? cleanInterviewReply)(reply);
        return { ok: true, reply: cleanedReply };
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
          "Commence l'entretien : présente-toi (ton prénom et ton rôle) en une phrase, salue-moi chaleureusement, puis pose-moi une première question d'ouverture en français. Sois naturelle et professionnelle.",
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
        content: `Voici la transcription complète de la simulation :\n\n${transcript}\n\nProduis le bilan structuré en français uniquement.`,
      },
    ],
    config: input.config,
    maxTokens: 700,
    cleanFn: cleanDebriefReply,
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
