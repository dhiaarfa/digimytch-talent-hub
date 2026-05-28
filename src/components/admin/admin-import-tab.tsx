"use client";

import { useState } from "react";
import { Sparkles, Link2, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createCourse, type AdminCourseInput } from "@/utils/actions/admin/actions";

type ExtractedCourse = {
  title?: string;
  organisme?: string;
  provider?: string;
  level?: string;
  skills_targeted?: string[] | string;
  url?: string;
  description?: string;
};

function parseExtractedJson(raw: string): ExtractedCourse {
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("JSON introuvable dans la réponse");
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as ExtractedCourse;
}

function toAdminInput(data: ExtractedCourse): AdminCourseInput | null {
  const title = data.title?.trim();
  const provider = (data.provider || data.organisme)?.trim();
  if (!title || !provider) return null;

  let skills: string[] = [];
  if (Array.isArray(data.skills_targeted)) {
    skills = data.skills_targeted.map((s) => String(s).trim()).filter(Boolean);
  } else if (typeof data.skills_targeted === "string") {
    skills = data.skills_targeted.split(",").map((s) => s.trim()).filter(Boolean);
  }

  return {
    title,
    provider,
    level: data.level?.trim() || "Intermédiaire",
    skills_targeted: skills,
    url: data.url?.trim() || null,
  };
}

export function AdminImportTab() {
  const [inputType, setInputType] = useState<"url" | "text">("text");
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ExtractedCourse | null>(null);

  const handleImport = async () => {
    setIsProcessing(true);
    setResult(null);
    try {
      const prompt =
        inputType === "url"
          ? `Voici l'URL d'une formation : ${input}. Extrais : titre, organisme (ou provider), niveau (Débutant/Intermédiaire/Avancé), compétences ciblées (liste), lien d'inscription (url). Réponds UNIQUEMENT en JSON valide sans markdown.`
          : `Voici un texte décrivant une formation : "${input}". Extrais : titre, organisme (ou provider), niveau, compétences ciblées (liste), url si présente, description optionnelle. Réponds UNIQUEMENT en JSON valide sans markdown.`;

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: "deepseek/deepseek-chat:free",
          maxTokens: 500,
          stream: false,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Extraction impossible");
      }

      const json = parseExtractedJson(data.text ?? "");
      setResult(json);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erreur lors de l'extraction. Vérifiez le contenu."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!result) return;
    const payload = toAdminInput(result);
    if (!payload) {
      toast.error("Titre et organisme requis dans les données extraites.");
      return;
    }
    setIsImporting(true);
    try {
      const created = await createCourse(payload);
      if (!created.ok) {
        toast.error(created.error);
        return;
      }
      toast.success("Formation importée dans le catalogue");
      setResult(null);
      setInput("");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Sparkles size={16} className="text-blue-600" aria-hidden />
          Import assisté par IA
        </h3>
        <p className="text-xs text-blue-700 mt-1">
          Collez un lien ou un texte décrivant une formation. L&apos;IA extrait les
          champs et les prépare pour l&apos;import.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setInputType("text")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border ${
            inputType === "text"
              ? "bg-[#030A8C] text-white border-[#030A8C]"
              : "bg-white"
          }`}
        >
          <FileText size={14} aria-hidden />
          Texte libre
        </button>
        <button
          type="button"
          onClick={() => setInputType("url")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border ${
            inputType === "url"
              ? "bg-[#030A8C] text-white border-[#030A8C]"
              : "bg-white"
          }`}
        >
          <Link2 size={14} aria-hidden />
          URL
        </button>
      </div>

      {inputType === "url" ? (
        <input
          className="w-full border rounded-lg px-4 py-3 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://www.coursera.org/learn/..."
        />
      ) : (
        <textarea
          className="w-full border rounded-lg px-4 py-3 text-sm min-h-[120px]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Formation React.js avancé par Digimytch Academy. Niveau intermédiaire. Couvre : hooks, performance, TypeScript..."
        />
      )}

      <button
        type="button"
        onClick={() => void handleImport()}
        disabled={!input.trim() || isProcessing}
        className="flex items-center gap-2 bg-gradient-to-r from-[#030A8C] to-[#D10069] text-white px-6 py-2.5 rounded-lg text-sm disabled:opacity-50"
      >
        {isProcessing ? (
          <Loader2 size={14} className="animate-spin" aria-hidden />
        ) : (
          <Sparkles size={14} aria-hidden />
        )}
        {isProcessing ? "Extraction en cours..." : "Extraire avec l'IA"}
      </button>

      {result && (
        <div className="border rounded-xl p-4 bg-green-50 border-green-200">
          <h4 className="font-semibold text-sm text-green-800 mb-3">
            Données extraites — vérifiez avant d&apos;importer
          </h4>
          <pre className="text-xs text-green-700 bg-white rounded p-3 overflow-auto max-h-48">
            {JSON.stringify(result, null, 2)}
          </pre>
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              type="button"
              onClick={() => void handleConfirmImport()}
              disabled={isImporting}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {isImporting ? "Import…" : "Importer dans le catalogue"}
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="border px-4 py-2 rounded-lg text-sm bg-white"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
