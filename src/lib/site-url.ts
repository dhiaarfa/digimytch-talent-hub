/** URL publique de l'app — tolère Vercel et valeurs sans schéma https. */
export function getPublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      return new URL(withScheme).origin;
    } catch {
      /* fall through */
    }
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, "")}`;
  }

  return "http://localhost:3001";
}
