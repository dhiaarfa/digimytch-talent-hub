import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import {
  getDefaultModel,
  selectBestModelForTask,
  type DigimytchTask,
} from "@/lib/ai-models";
import { normalizeDigimytchOpenRouterModelId } from "@/lib/digimytch-openrouter-models";
import { getSubscriptionPlan } from "@/utils/actions/stripe/actions";
import { friendlyAIErrorMessage } from "@/lib/ai/friendly-error";

export { friendlyAIErrorMessage };

export async function getAIPlanState() {
  const { plan, id } = await getSubscriptionPlan(true);
  return {
    isPro: IS_DIGIMYTCH_TALENT_HUB || plan === "pro",
    userId: id ?? "",
  };
}

export function resolveTaskModel(
  task: DigimytchTask | "linkedin",
  isPro: boolean,
  override?: string | null
): string {
  const trimmed = override?.trim();
  if (trimmed) {
    return IS_DIGIMYTCH_TALENT_HUB
      ? normalizeDigimytchOpenRouterModelId(trimmed)
      : trimmed;
  }
  if (IS_DIGIMYTCH_TALENT_HUB) return selectBestModelForTask(task);
  return getDefaultModel(isPro);
}

