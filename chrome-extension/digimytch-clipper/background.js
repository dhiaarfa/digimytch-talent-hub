/**
 * Service worker — appels API Digimytch (contourne CORS via host_permissions).
 */

const DEFAULT_APP_URL = "http://localhost:3001";

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      { appUrl: DEFAULT_APP_URL, manualJwt: "" },
      (items) => resolve(items)
    );
  });
}

async function parseSupabaseAccessToken(appUrl) {
  try {
    const cookies = await chrome.cookies.getAll({ url: appUrl });
    const authCookies = cookies
      .filter((c) => /sb-.*-auth-token/.test(c.name))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (authCookies.length === 0) return null;

    let raw = authCookies.map((c) => c.value).join("");
    if (raw.startsWith("base64-")) {
      raw = atob(raw.slice(7));
    }
    try {
      raw = decodeURIComponent(raw);
    } catch {
      /* already decoded */
    }

    const session = JSON.parse(raw);
    return session.access_token || session.accessToken || null;
  } catch {
    return null;
  }
}

async function resolveAccessToken() {
  const { appUrl, manualJwt } = await getSettings();
  const url = (appUrl || DEFAULT_APP_URL).replace(/\/$/, "");

  if (manualJwt && manualJwt.trim().length > 20) {
    return { token: manualJwt.trim(), appUrl: url };
  }

  const fromCookie = await parseSupabaseAccessToken(url);
  return { token: fromCookie, appUrl: url };
}

async function clipJob(payload) {
  const { token, appUrl } = await resolveAccessToken();
  if (!token) {
    throw new Error("Non connecté — ouvrez Digimytch ou collez un JWT dans les paramètres.");
  }

  const res = await fetch(`${appUrl}/api/jobs/clip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Erreur ${res.status}`);
  }
  return body;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "DIGIMYTCH_CLIP_JOB") {
    clipJob(message.payload)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((e) => sendResponse({ ok: false, error: e.message || String(e) }));
    return true;
  }

  if (message?.type === "DIGIMYTCH_CHECK_AUTH") {
    resolveAccessToken()
      .then(({ token, appUrl }) =>
        sendResponse({ ok: true, loggedIn: Boolean(token), appUrl })
      )
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
});
