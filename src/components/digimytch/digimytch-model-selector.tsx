'use client'

import {
  DIGIMYTCH_DEFAULT_MODEL_ID,
  DIGIMYTCH_FREE_MODELS,
} from '@/lib/ai-models'
import { useDefaultModel } from '@/hooks/use-api-keys'

export function DigimytchModelSelector() {
  const { defaultModel, setDefaultModel } = useDefaultModel()
  const selected =
    DIGIMYTCH_FREE_MODELS.some((m) => m.id === defaultModel)
      ? defaultModel
      : DIGIMYTCH_DEFAULT_MODEL_ID

  return (
    <div className="px-3 py-2 border-t border-[var(--digi-border)]">
      <p className="text-xs text-muted-foreground mb-1">Modèle IA actif :</p>
      <select
        value={selected}
        onChange={(e) => setDefaultModel(e.target.value)}
        className="w-full text-xs border border-[var(--digi-border)] rounded px-2 py-1.5 bg-white text-[var(--digi-navy)]"
        aria-label="Modèle IA actif"
      >
        {DIGIMYTCH_FREE_MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} — {model.badge}
          </option>
        ))}
      </select>
    </div>
  )
}
