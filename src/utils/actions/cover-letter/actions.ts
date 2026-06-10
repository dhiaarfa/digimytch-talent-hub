'use server';
import { logger } from '@/lib/logger';

import { generateText, LanguageModelV1, streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { type AIConfig } from '@/utils/ai-tools';
import { getAIPlanState, resolveTaskModel } from '@/lib/ai/plan';
import { normalizeCoverLetterContent } from '@/lib/cover-letter-html';
import {
  finishAIUsageRequest,
  startAIUsageRequest,
} from '@/lib/ai/usage-ledger';

export type CoverLetterResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

const COVER_LETTER_SYSTEM = `Tu es rédacteur senior de lettres de motivation pour Digimytch Talent Hub (Tunisie / marché francophone).

Rédige en français professionnel, clair et convaincant (380–520 mots).
Format HTML simple : balises <p> et <br /> uniquement.

Structure obligatoire :
1. En-tête : date, coordonnées candidat, entreprise si connue
2. Objet : « Candidature au poste de … »
3. Accroche percutante (1 paragraphe) liée à l'offre
4. Valeur ajoutée : 2 paragraphes avec compétences et réalisations du CV (verbes d'action, chiffres si présents)
5. Motivation pour l'entreprise et le poste
6. Formule de politesse avec signature (prénom nom)

Normes :
- Ton professionnel, direct, sans jargon creux ni formules datées (« je me permets de… » en excès)
- Aligner le vocabulaire sur les mots-clés de l'offre sans surcharger
- N'invente aucune expérience, diplôme ou compétence absente des données
- Ne mentionne aucun autre produit logiciel que Digimytch Talent Hub si pertinent`;

/** Génération fiable (sans stream) — recommandée pour la démo PFE */
export async function generateCoverLetterText(
  prompt: string,
  config?: AIConfig
): Promise<CoverLetterResult> {
  try {
    const { isPro, userId } = await getAIPlanState();
    const resolvedConfig = {
      model: resolveTaskModel('lettre', isPro, config?.model),
      apiKeys: config?.apiKeys ?? [],
    };

    const { model, usageEventId } = await startAIUsageRequest({
      userId,
      route: 'actions.coverLetter.generateText',
      config: resolvedConfig,
      isPro,
    });

    const { text, usage } = await generateText({
      model,
      system: COVER_LETTER_SYSTEM,
      prompt,
      maxTokens: 1200,
    });

    await finishAIUsageRequest({
      usageEventId,
      status: 'succeeded',
      usage,
    });

    const content = normalizeCoverLetterContent(text?.trim());
    if (!content || content === "<p></p>") {
      return { ok: false, error: "Réponse vide de l'assistant." };
    }

    return { ok: true, content };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Impossible de générer la lettre pour le moment.';
    return { ok: false, error: message };
  }
}

export async function generate(input: string, config?: AIConfig) {
  try {
    const stream = createStreamableValue('');
    const { isPro, userId } = await getAIPlanState();
    const resolvedConfig = {
      model: resolveTaskModel('lettre', isPro, config?.model),
      apiKeys: config?.apiKeys ?? [],
    };
    const {
      model: aiClient,
      usageEventId,
    } = await startAIUsageRequest({
      userId,
      route: 'actions.coverLetter.generate',
      config: resolvedConfig,
      isPro,
    });

   const system = `
   
   You are a professional cover letter writer with expertise in crafting compelling, personalized cover letters. Your goal is to produce a cover letter that is clear, concise, and tailored to the job and candidate data provided. The final cover letter should be between 600-700 words and written in a consistent, professional tone that seamlessly blends technical details with personal enthusiasm.

   Focus on:
   - Clear, concise, and professional writing.
   - Highlighting relevant experience with unique insights in each section.
   - Matching the candidate’s qualifications to the job requirements.
   - Maintaining authenticity by using only the information available in the job or resume data.
   - Enforcing the target word count without omitting key details.
   - **Distinctly separating each section as its own paragraph** — output each paragraph with exactly one <br /> tag at the end, with no extra spacing or additional line breaks.

   Ensure your output is in HTML format (do NOT start with HTML tags) and strictly follow these formatting rules:

   CRITICAL FORMATTING REQUIREMENTS – YOU MUST FOLLOW THESE EXACTLY:
   1. Do NOT use any square brackets [] in the output.
   2. Only include information that is available in the job or resume data.
   3. Each piece of information MUST be on its own separate line using <br /> tags.
   4. Use actual values directly, not placeholders.
   5. Format the header EXACTLY like this (but without the brackets, using real data):

      <p>
      [Date]<br />
      [Company Name]<br />
      [Company Address]<br />
      [City, Province/State, Country]<br />
      </p>
      - If certain data (like company address) is missing, adjust the header accordingly without leaving placeholders.
   6. Format the signature EXACTLY like this (but without the brackets, using real data):
      <p>
      Sincerely,<br /><br />
      [Full Name]<br />
      </p>
      
      <p>
      [Email Address]<br />
      [Phone Number]<br />
      [LinkedIn URL]<br />
      </p>
   7. NEVER combine multiple pieces of information on the same line; ALWAYS use <br /> tags between each piece.
   8. Add an extra <br /> after the date and after "Sincerely,".

   Divide the cover letter into the following sections, ensuring **each section is output as a separate paragraph** (use <p> tags or <br /> for clear breaks):

   1. **Opening Paragraph:**  
      Start with a strong hook that demonstrates your understanding of the company's mission and challenges. Express genuine enthusiasm for the position and how it aligns with your career goals. Mention any personal connection to the company or industry. (4-5 sentences)

   2. **Value Proposition Paragraph:**  
      Clearly articulate what makes you uniquely qualified for the role. Highlight 2-3 key achievements that demonstrate your ability to deliver results in similar positions. Use metrics and specific outcomes where possible. (5-6 sentences)  
      *Ensure this section provides unique insights without repeating content from other sections.*

   3. **Technical Expertise Paragraph:**  
      Detail your relevant technical skills and tools, focusing on those mentioned in the job description. Provide concrete examples of projects where you successfully applied these skills. (5-6 sentences)  
      *Maintain a consistent professional tone while describing technical details.*

   4. **Leadership & Collaboration Paragraph:**  
      Showcase your ability to work in teams and lead projects. Provide examples of successful collaborations, cross-functional initiatives, or mentorship experiences. Highlight soft skills like communication and problem-solving. (4-5 sentences)

   5. **Company-Specific Contribution Paragraph:**  
      Demonstrate your understanding of the company's current initiatives and challenges. Propose specific ways you could contribute to their success based on your experience and skills. (4-5 sentences)

   6. **Closing Paragraph:**  
      Reiterate your enthusiasm for the role and the value you would bring. Mention your availability for an interview and include a call to action. (3-4 sentences)

   Additional Guidelines:
   - Ensure each paragraph offers unique insights and does not repeat content from other sections.
   - Maintain a consistent, professional tone throughout the letter.
   - Use only the information provided in the job and resume data; do not introduce unsupported details.
   - **Each section must be distinctly separated from the others. Do not output the cover letter as one continuous block.**
   - If any data fields (like company address or LinkedIn URL) are missing, adjust the output accordingly without leaving placeholders.

   Generate the cover letter as specified above, ensuring that each section is clearly separated into distinct paragraphs.

   
   `;

    (async () => {
      const { textStream } = streamText({
        model: aiClient as LanguageModelV1,
        system,
        prompt: input,
        onFinish: async ({ usage }) => {
         const { promptTokens, completionTokens, totalTokens } = usage;
  
         // your own logic, e.g. for saving the chat history or recording usage
         logger.debug('----------Usage:----------');
         logger.debug('Prompt tokens:', promptTokens);
         logger.debug('Completion tokens:', completionTokens);
         logger.debug('Total tokens:', totalTokens);
         await finishAIUsageRequest({
           usageEventId,
           status: 'succeeded',
           usage,
         });
       },
       onError: async ({ error }) => {
         await finishAIUsageRequest({
           usageEventId,
           status: 'failed',
           errorCode: error instanceof Error ? error.message : 'stream_error',
         });
       },
 
      });

      for await (const delta of textStream) {
        stream.update(delta);
      }

     
      stream.done();
    })();

    return { output: stream.value };
  } catch (error) {
    logger.error('Error generating cover letter:', error);
    throw error;
  }
}
