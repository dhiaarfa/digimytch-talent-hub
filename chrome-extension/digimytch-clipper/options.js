const appUrlInput = document.getElementById("app-url");
const jwtInput = document.getElementById("manual-jwt");
const authStatus = document.getElementById("auth-status");
const savedMsg = document.getElementById("saved");

function refreshAuthStatus() {
  chrome.runtime.sendMessage({ type: "DIGIMYTCH_CHECK_AUTH" }, (res) => {
    if (res?.loggedIn) {
      authStatus.textContent = `Connecté à ${res.appUrl}`;
      authStatus.className = "status ok";
    } else {
      authStatus.textContent =
        "Non connecté — ouvrez Digimytch dans Chrome ou collez un JWT ci-dessous.";
      authStatus.className = "status warn";
    }
  });
}

chrome.storage.sync.get(
  { appUrl: "http://localhost:3001", manualJwt: "" },
  (items) => {
    appUrlInput.value = items.appUrl;
    jwtInput.value = items.manualJwt;
    refreshAuthStatus();
  }
);

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.sync.set(
    {
      appUrl: appUrlInput.value.trim() || "http://localhost:3001",
      manualJwt: jwtInput.value.trim(),
    },
    () => {
      savedMsg.style.display = "block";
      refreshAuthStatus();
      setTimeout(() => {
        savedMsg.style.display = "none";
      }, 2500);
    }
  );
});
