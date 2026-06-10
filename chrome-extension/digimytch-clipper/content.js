/**
 * Digimytch Job Clipper — extraction intelligente (LinkedIn, Indeed, fallback générique).
 * Toutes les opérations DOM sont encapsulées dans try/catch pour ne pas casser la page.
 */

function textOf(el) {
  try {
    if (!el) return "";
    return (el.textContent || el.innerText || "").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

function query(sel) {
  try {
    return document.querySelector(sel);
  } catch {
    return null;
  }
}

function getSelectedText() {
  try {
    const sel = window.getSelection();
    return sel ? sel.toString().trim() : "";
  } catch {
    return "";
  }
}

function detectSource() {
  try {
    const host = location.hostname.replace(/^www\./, "");
    if (host.includes("linkedin.com")) return "linkedin";
    if (host.includes("indeed.")) return "indeed";
    return "generic";
  } catch {
    return "generic";
  }
}

function extractLinkedIn() {
  try {
    const title =
      textOf(query("h1.job-title")) ||
      textOf(query("h1.t-24")) ||
      textOf(query("h1"));
    const company =
      textOf(query("a.topcard__org-name-link")) ||
      textOf(query("a.topcard__org-name")) ||
      textOf(query(".job-details-jobs-unified-top-card__company-name"));
    const locationText =
      textOf(query(".job-details-jobs-unified-top-card__bullet")) ||
      textOf(query(".topcard__flavor--bullet"));
    const description =
      textOf(query("div.show-more-less-html__markup")) ||
      textOf(query(".jobs-description__content")) ||
      textOf(query("#job-details"));
    return { title, company, location: locationText, description };
  } catch {
    return null;
  }
}

function extractIndeed() {
  try {
    const title =
      textOf(query("h1[data-jk]")) ||
      textOf(query("h1.jobsearch-JobInfoHeader-title")) ||
      textOf(query("h1"));
    const company =
      textOf(query('[data-company-name="true"]')) ||
      textOf(query("div[data-testid='inlineHeader-companyName']")) ||
      textOf(query(".company_location a")) ||
      textOf(query(".company_location"));
    const locationText =
      textOf(query('[data-testid="job-location"]')) ||
      textOf(query(".company_location"));
    const description =
      textOf(query("#jobDescriptionText")) ||
      textOf(query(".jobsearch-jobDescriptionText"));
    return { title, company, location: locationText, description };
  } catch {
    return null;
  }
}

function extractGeneric() {
  try {
    const selected = getSelectedText();
    const title = document.title.split("|")[0].split("-")[0].trim();
    const company = location.hostname.replace(/^www\./, "");
    const description =
      selected ||
      textOf(query("article")) ||
      textOf(query("main")) ||
      "";
    return {
      title: title || "Poste à préciser",
      company,
      location: "",
      description,
    };
  } catch {
    return {
      title: "Poste à préciser",
      company: "",
      location: "",
      description: "",
    };
  }
}

function extractJobData() {
  try {
    const source = detectSource();
    let data = null;

    if (source === "linkedin") data = extractLinkedIn();
    else if (source === "indeed") data = extractIndeed();
    else data = extractGeneric();

    if (!data) data = extractGeneric();

    const selected = getSelectedText();
    if (selected.length > 80 && (!data.description || data.description.length < selected.length)) {
      data.description = selected;
    }

    return {
      title: data.title || "",
      company: data.company || "",
      location: data.location || "",
      description: data.description || "",
      source_url: location.href,
      source,
    };
  } catch (e) {
    return {
      title: "",
      company: "",
      location: "",
      description: "",
      source_url: typeof location !== "undefined" ? location.href : "",
      source: "generic",
      error: String(e),
    };
  }
}

try {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "DIGIMYTCH_EXTRACT_JOB") {
      try {
        sendResponse({ ok: true, data: extractJobData() });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    }
    return true;
  });
} catch {
  /* content script isolation */
}
