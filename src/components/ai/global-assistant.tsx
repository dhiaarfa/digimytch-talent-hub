"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { withBasePath } from "@/lib/utils";
import { normalizeDigimytchOpenRouterModelId } from "@/lib/digimytch-openrouter-models";

const DIGIMYTCH_AI_MODEL_STORAGE_KEY = "digi-ai-model";
const DEFAULT_CHAT_MODEL = "openrouter/free";

type Message = {
  role: "user" | "assistant";
  content: string;
};

function getSystemPrompt(pathname: string, isLoggedIn: boolean): string {
  const base = `Tu es l'assistant Digimytch Talent Hub, une plateforme tunisienne d'insertion professionnelle.
Tu réponds en français, de manière concise (max 3 phrases sauf si l'utilisateur demande plus).
Tu peux guider l'utilisateur, répondre à ses questions, et suggérer des actions sur la plateforme.`;

  if (!isLoggedIn) {
    return `${base}
L'utilisateur n'est pas connecté. Tu peux expliquer les fonctionnalités : CV intelligent IA, matching emploi-profil, formations recommandées, simulateur d'entretien.
Encourage-le à créer un compte gratuit via « Connexion » ou « Créer un compte ».`;
  }

  const contextByPage: Record<string, string> = {
    "/home": "L'utilisateur est sur le tableau de bord principal.",
    "/resumes": "L'utilisateur gère ses CV. Tu peux l'aider à créer, améliorer ou expliquer les sections.",
    "/score-cv": "L'utilisateur analyse le score d'un CV (importé ou existant) hors éditeur.",
    "/jobs": "L'utilisateur analyse des offres d'emploi. Tu peux expliquer les scores et les compétences manquantes.",
    "/formations": "L'utilisateur consulte le catalogue de formations recommandées.",
    "/candidatures": "L'utilisateur suit ses candidatures en Kanban.",
    "/entretiens": "L'utilisateur utilise le simulateur d'entretien IA.",
    "/admin": "L'utilisateur est dans l'espace administration (formations, import IA).",
  };

  const pageContext =
    Object.entries(contextByPage).find(([path]) => pathname.startsWith(path))?.[1] ||
    "";

  return `${base}\n${pageContext}\nSois utile et guide l'utilisateur vers les bonnes actions.`;
}

function readChatModel(): string {
  if (typeof window === "undefined") return DEFAULT_CHAT_MODEL;
  const stored = localStorage.getItem(DIGIMYTCH_AI_MODEL_STORAGE_KEY);
  return normalizeDigimytchOpenRouterModelId(stored || DEFAULT_CHAT_MODEL);
}

export function GlobalAssistant({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: isLoggedIn
        ? "Bonjour ! Je suis votre assistant Digimytch. Comment puis-je vous aider ?"
        : "Bonjour ! Je suis l'assistant Digimytch. Vous avez des questions sur la plateforme ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    const history: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(history);
    setIsLoading(true);

    try {
      const response = await fetch(withBasePath("/api/assistant"), {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          system: getSystemPrompt(pathname, isLoggedIn),
          model: readChatModel(),
          maxTokens: 300,
          stream: true,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          typeof err.error === "string" ? err.error : "Réponse invalide"
        );
      }

      const reader = response.body?.getReader();
      let assistantMessage = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantMessage += decoder.decode(value, { stream: true });
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: "assistant", content: assistantMessage },
          ]);
        }
      } else if (assistantMessage === "") {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: "Je n'ai pas reçu de réponse. Réessayez dans un instant.",
          },
        ]);
      }
    } catch (error) {
      const errText =
        error instanceof Error
          ? error.message
          : "Désolé, une erreur est survenue. Vérifiez la configuration OpenRouter.";
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.content) {
          return [...prev.slice(0, -1), { role: "assistant", content: errText }];
        }
        return [...prev, { role: "assistant", content: errText }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 bg-gradient-to-br from-[#030A8C] to-[#D10069] flex items-center justify-center text-white hover:scale-110 transition-transform"
          title="Assistant Digimytch"
          aria-label="Ouvrir l'assistant Digimytch"
        >
          <Sparkles size={22} aria-hidden />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-100"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#030A8C] to-[#D10069]">
              <div className="flex items-center gap-2 text-white">
                <Sparkles size={16} aria-hidden />
                <span className="font-semibold text-sm">Assistant Digimytch</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsMinimized((m) => !m)}
                  className="text-white/70 hover:text-white p-1"
                  aria-label={isMinimized ? "Agrandir" : "Réduire"}
                >
                  <Minimize2 size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-white/70 hover:text-white p-1"
                  aria-label="Fermer"
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {messages.map((msg, i) => (
                    <div
                      key={`${msg.role}-${i}`}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === "user"
                            ? "bg-[#030A8C] text-white"
                            : "bg-white border border-gray-200 text-gray-800"
                        }`}
                      >
                        {msg.content ||
                          (isLoading && i === messages.length - 1 && msg.role === "assistant"
                            ? "…"
                            : "")}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {messages.length === 1 && (
                  <div className="px-3 py-2 flex gap-2 overflow-x-auto border-t bg-white">
                    {[
                      "Comment analyser une offre ?",
                      "Comment créer mon CV ?",
                      "À quoi servent les formations ?",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setInput(suggestion)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 whitespace-nowrap transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 p-3 border-t bg-white">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Posez votre question..."
                    className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#030A8C]/20"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={isLoading || !input.trim()}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#030A8C] to-[#D10069] text-white flex items-center justify-center disabled:opacity-50"
                    aria-label="Envoyer"
                  >
                    <Send size={14} aria-hidden />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
