"use client";

/**
 * Resume Preview — generates PDF with @react-pdf/renderer, displays via native iframe
 * (avoids pdf.js Headers bug with blob URLs in react-pdf).
 */

import { Resume } from "@/lib/types";
import { useState, useEffect, memo, useMemo } from "react";
import { pdf } from "@react-pdf/renderer";
import { ResumePDFDocument } from "./resume-pdf-document";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const pdfCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000;
const CACHE_EXPIRATION_TIME = 30 * 60 * 1000;

function generateResumeHash(resume: Resume): string {
  const content = JSON.stringify({
    basic: {
      name: `${resume.first_name} ${resume.last_name}`,
      contact: [
        resume.email,
        resume.phone_number,
        resume.location,
        resume.website,
        resume.linkedin_url,
        resume.github_url,
      ],
    },
    sections: {
      skills: resume.skills,
      experience: resume.work_experience,
      projects: resume.projects,
      education: resume.education,
    },
    settings: resume.document_settings,
  });

  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function cleanupCache() {
  const now = Date.now();
  for (const [hash, { url, timestamp }] of pdfCache.entries()) {
    if (now - timestamp > CACHE_EXPIRATION_TIME) {
      URL.revokeObjectURL(url);
      pdfCache.delete(hash);
    }
  }
}

if (typeof window !== "undefined") {
  setInterval(cleanupCache, CACHE_CLEANUP_INTERVAL);
}

interface ResumePreviewProps {
  resume: Resume;
  variant?: "base" | "tailored";
  containerWidth: number;
}

export const ResumePreview = memo(function ResumePreview({
  resume,
  variant = "base",
  containerWidth,
}: ResumePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const debouncedWidth = useDebouncedValue(containerWidth, 100);
  const resumeHash = useMemo(() => generateResumeHash(resume), [resume]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function generatePDF() {
      setPdfError(null);
      try {
        const cached = pdfCache.get(resumeHash);
        if (cached) {
          if (!cancelled) setPreviewUrl(cached.url);
          return;
        }

        const blob = await pdf(
          <ResumePDFDocument resume={resume} variant={variant} />
        ).toBlob();
        objectUrl = URL.createObjectURL(blob);
        pdfCache.set(resumeHash, { url: objectUrl, timestamp: Date.now() });

        if (!cancelled) setPreviewUrl(objectUrl);
      } catch (error) {
        console.error("[ResumePreview] PDF generation failed:", error);
        if (!cancelled) {
          setPdfError("Impossible de générer l'aperçu PDF.");
          setPreviewUrl(null);
        }
      }
    }

    void generatePDF();

    return () => {
      cancelled = true;
      if (objectUrl && !pdfCache.has(resumeHash)) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [resumeHash, variant, resume]);

  const widthPx = Math.max(320, Math.round(debouncedWidth));

  if (pdfError) {
    return (
      <div className="w-full aspect-[8.5/11] bg-white shadow-lg p-8 flex items-center justify-center">
        <p className="text-sm text-red-600 text-center">{pdfError}</p>
      </div>
    );
  }

  if (!previewUrl) {
    return (
      <div className="w-full aspect-[8.5/11] bg-white shadow-lg p-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 w-1/3 mx-auto rounded" />
          <div className="h-3 bg-gray-200 w-full rounded" />
          <div className="h-3 bg-gray-200 w-5/6 rounded" />
          <div className="h-3 bg-gray-200 w-4/6 rounded" />
        </div>
        <p className="text-xs text-center text-[var(--digi-muted)] mt-4">Génération de l&apos;aperçu…</p>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-black/10 flex justify-center py-2 min-h-[480px]">
      <object
        data={`${previewUrl}#toolbar=0&navpanes=0`}
        type="application/pdf"
        title="Aperçu du CV"
        className="bg-white shadow-xl border-0"
        style={{
          width: widthPx,
          minHeight: Math.round(widthPx * (11 / 8.5)),
        }}
      >
        <iframe
          src={`${previewUrl}#toolbar=0&navpanes=0`}
          title="Aperçu du CV"
          className="bg-white shadow-xl border-0 w-full"
          style={{
            width: widthPx,
            minHeight: Math.round(widthPx * (11 / 8.5)),
          }}
        />
      </object>
    </div>
  );
}, (prev, next) =>
  generateResumeHash(prev.resume) === generateResumeHash(next.resume) &&
  prev.variant === next.variant &&
  Math.abs(prev.containerWidth - next.containerWidth) < 4
);
