"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  type CoverLetterDocumentSettings,
  DEFAULT_COVER_LETTER_SETTINGS,
} from "@/lib/cover-letter-settings";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CoverLetterDocumentSettingsProps {
  settings: CoverLetterDocumentSettings;
  onChange: (settings: CoverLetterDocumentSettings) => void;
}

function SettingRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <Label className="text-[var(--digi-muted)]">{label}</Label>
        <span className="font-medium text-[var(--digi-navy)]">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

export function CoverLetterDocumentSettingsPanel({
  settings,
  onChange,
}: CoverLetterDocumentSettingsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2 h-9">
          <Settings2 className="h-4 w-4" aria-hidden />
          Mise en page
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-sm text-[var(--digi-navy)]">Design de la lettre</p>
            <p className="text-xs text-[var(--digi-muted)] mt-0.5">
              Ajustez la typographie et les marges comme pour votre CV.
            </p>
          </div>
          <SettingRow
            label="Taille du texte"
            value={settings.document_font_size}
            min={9}
            max={16}
            step={0.5}
            unit=" pt"
            onChange={(document_font_size) => onChange({ ...settings, document_font_size })}
          />
          <SettingRow
            label="Interligne"
            value={settings.document_line_height}
            min={1.2}
            max={2}
            step={0.05}
            unit=""
            onChange={(document_line_height) => onChange({ ...settings, document_line_height })}
          />
          <SettingRow
            label="Marge verticale"
            value={settings.document_margin_vertical}
            min={24}
            max={96}
            step={4}
            unit=" px"
            onChange={(document_margin_vertical) =>
              onChange({ ...settings, document_margin_vertical })
            }
          />
          <SettingRow
            label="Marge horizontale"
            value={settings.document_margin_horizontal}
            min={32}
            max={120}
            step={4}
            unit=" px"
            onChange={(document_margin_horizontal) =>
              onChange({ ...settings, document_margin_horizontal })
            }
          />
          <SettingRow
            label="Espacement paragraphes"
            value={settings.paragraph_spacing}
            min={4}
            max={32}
            step={2}
            unit=" px"
            onChange={(paragraph_spacing) => onChange({ ...settings, paragraph_spacing })}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => onChange({ ...DEFAULT_COVER_LETTER_SETTINGS })}
          >
            Réinitialiser les valeurs par défaut
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
