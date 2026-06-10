const loginView = document.getElementById("login-view");
const formView = document.getElementById("form-view");
const successView = document.getElementById("success-view");
const errorBox = document.getElementById("error-box");
const saveBtn = document.getElementById("save-btn");
const expandDesc = document.getElementById("expand-desc");
const descriptionEl = document.getElementById("description");

let appUrl = "http://localhost:3001";

function show(el) {
  [loginView, formView, successView].forEach((v) => v.classList.add("hidden"));
  el.classList.remove("hidden");
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
}

async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

async function extractFromPage() {
  const tabId = await getActiveTabId();
  if (!tabId) return null;
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type: "DIGIMYTCH_EXTRACT_JOB" });
    return res?.ok ? res.data : null;
  } catch {
    return null;
  }
}

function fillForm(data) {
  if (!data) return;
  document.getElementById("title").value = data.title || "";
  document.getElementById("company").value = data.company || "";
  document.getElementById("location").value = data.location || "";
  document.getElementById("description").value = (data.description || "").slice(0, 12000);
  document.getElementById("source-tag").textContent = data.source || "generic";
}

expandDesc.addEventListener("click", () => {
  descriptionEl.classList.toggle("collapsed");
  expandDesc.textContent = descriptionEl.classList.contains("collapsed")
    ? "Afficher tout ↓"
    : "Réduire ↑";
});

document.getElementById("options-link").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

saveBtn.addEventListener("click", async () => {
  hideError();
  const title = document.getElementById("title").value.trim();
  const company = document.getElementById("company").value.trim();
  const description = document.getElementById("description").value.trim();
  const location = document.getElementById("location").value.trim();
  const initial_status = document.getElementById("status").value;

  if (!title) {
    showError("Indiquez le titre du poste.");
    return;
  }
  if (description.length < 10) {
    showError("La description doit contenir au moins 10 caractères.");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Enregistrement…";

  const tabId = await getActiveTabId();
  let source_url = null;
  if (tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      source_url = tab.url || null;
    } catch {
      /* ignore */
    }
  }

  chrome.runtime.sendMessage(
    {
      type: "DIGIMYTCH_CLIP_JOB",
      payload: {
        title,
        company,
        description,
        location: location || null,
        source_url,
        initial_status,
      },
    },
    (response) => {
      saveBtn.disabled = false;
      saveBtn.textContent = "Enregistrer dans mon Kanban";

      if (chrome.runtime.lastError) {
        showError(chrome.runtime.lastError.message);
        return;
      }
      if (!response?.ok) {
        showError(response?.error || "Erreur inconnue");
        return;
      }

      document.getElementById("success-link").href = `${appUrl}/candidatures`;
      show(successView);
    }
  );
});

async function init() {
  chrome.runtime.sendMessage({ type: "DIGIMYTCH_CHECK_AUTH" }, async (auth) => {
    if (auth?.appUrl) appUrl = auth.appUrl.replace(/\/$/, "");
    document.getElementById("login-link").href = `${appUrl}/auth/login`;
    document.getElementById("success-link").href = `${appUrl}/candidatures`;

    if (!auth?.loggedIn) {
      show(loginView);
      return;
    }

    show(formView);
    const data = await extractFromPage();
    fillForm(data);
  });
}

init();
