import "server-only";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendMailResult =
  | { ok: true }
  | { ok: false; error: string };

function getFromAddress(): string | null {
  return (
    process.env.FEEDBACK_REPLY_FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    null
  );
}

async function sendViaResend(input: SendMailInput): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = getFromAddress();
  if (!apiKey || !from) {
    return { ok: false, error: "RESEND_API_KEY ou FEEDBACK_REPLY_FROM_EMAIL manquant." };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html ?? undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      error: body || `Envoi email échoué (${res.status}).`,
    };
  }

  return { ok: true };
}

/**
 * Envoie un e-mail transactionnel (réponses réclamations, etc.).
 * Production : configurez RESEND_API_KEY + FEEDBACK_REPLY_FROM_EMAIL.
 * Développement sans clé : log console uniquement (pas d'envoi réel).
 */
export async function sendTransactionalEmail(
  input: SendMailInput
): Promise<SendMailResult> {
  const to = input.to.trim();
  if (!to || !to.includes("@")) {
    return { ok: false, error: "Adresse destinataire invalide." };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[sendTransactionalEmail:dev]", {
        to,
        subject: input.subject,
        preview: input.text.slice(0, 200),
      });
      return { ok: true };
    }
    return {
      ok: false,
      error:
        "Envoi d'e-mails non configuré. Ajoutez RESEND_API_KEY et FEEDBACK_REPLY_FROM_EMAIL.",
    };
  }

  return sendViaResend(input);
}
