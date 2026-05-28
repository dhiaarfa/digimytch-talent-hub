export function getSpeechRecognitionSupport(): {
  supported: boolean;
  browserName: string;
  reason: string;
} {
  if (typeof window === "undefined") {
    return { supported: false, browserName: "unknown", reason: "ssr" };
  }

  const SpeechRecognitionAPI =
    window.SpeechRecognition ?? window.webkitSpeechRecognition;

  const ua = navigator.userAgent;
  const isFirefox = /firefox/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|chromium|edg/i.test(ua);
  const isChrome = /chrome|edg/i.test(ua);

  const supported = Boolean(SpeechRecognitionAPI);

  let browserName = "unknown";
  if (isFirefox) browserName = "firefox";
  else if (isSafari) browserName = "safari";
  else if (isChrome) browserName = "chrome";

  return {
    supported,
    browserName,
    reason: supported ? "ok" : "unsupported",
  };
}

export function getInterviewSttFallbackMessage(isEn: boolean): string {
  const { browserName, supported } = getSpeechRecognitionSupport();
  if (supported) return "";

  if (browserName === "firefox") {
    return isEn
      ? "Firefox does not support Web Speech API. Use the text field below, or switch to OpenRouter STT if you have credits."
      : "Firefox ne prend pas en charge la reconnaissance vocale du navigateur. Utilisez le champ texte ci-dessous, ou activez la transcription OpenRouter si vous avez des crédits.";
  }
  if (browserName === "safari") {
    return isEn
      ? "Safari has limited speech support. Use the text field below, or Chrome/Edge for voice input."
      : "Safari offre une reconnaissance vocale limitée. Utilisez le champ texte ou Chrome/Edge pour une meilleure expérience.";
  }
  return isEn
    ? "Voice input is not available in this browser. Use the text field below."
    : "Saisie vocale indisponible sur ce navigateur. Utilisez le champ texte ci-dessous.";
}
