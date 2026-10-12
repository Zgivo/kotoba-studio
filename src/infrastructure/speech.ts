export function speakJapanese(text: string): boolean {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
  return true;
}
