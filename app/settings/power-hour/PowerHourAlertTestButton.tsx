"use client";

export default function PowerHourAlertTestButton() {
  function testVoice() {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      "Grab your P.P.E. — POWER HOUR!",
    );

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={testVoice}
      className="test-button"
    >
      🔊 Test Power Hour Voice
    </button>
  );
}