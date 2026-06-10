"use client";

import { useEffect } from "react";
import {
  DIGIMYTCH_AI_MODEL_STORAGE_KEY,
  selectBestModelForTask,
} from "@/lib/ai-models";
import { normalizeDigimytchOpenRouterModelId } from "@/lib/digimytch-openrouter-models";

const LEGACY_MODEL_KEY = "resumelm-default-model";

/** Corrige les anciens modèles OpenRouter invalides stockés dans le navigateur. */
export function DigimytchModelMigrator() {
  useEffect(() => {
    const defaultChat = selectBestModelForTask("chat");
    const digi = localStorage.getItem(DIGIMYTCH_AI_MODEL_STORAGE_KEY);
    const legacy = localStorage.getItem(LEGACY_MODEL_KEY);
    const normalizedDigi = normalizeDigimytchOpenRouterModelId(digi || defaultChat);
    const normalizedLegacy = legacy
      ? normalizeDigimytchOpenRouterModelId(legacy)
      : null;

    if (digi !== normalizedDigi) {
      localStorage.setItem(DIGIMYTCH_AI_MODEL_STORAGE_KEY, normalizedDigi);
    }
    if (legacy && normalizedLegacy && legacy !== normalizedLegacy) {
      localStorage.setItem(LEGACY_MODEL_KEY, normalizedLegacy);
    }
  }, []);

  return null;
}
