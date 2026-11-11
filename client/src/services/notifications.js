/**
 * High-reliability browser audio chime and tab title alerts.
 * Uses Web Audio API without requiring any external audio files.
 */

export const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First harmonic tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5 tone
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5 tone

    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second soft resonance tone for rich chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.1, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.1);
    osc2.stop(now + 0.4);
  } catch (err) {
    // Graceful fallback if audio is autoplay-restricted by the browser
    console.debug('[Audio] Could not play chime:', err);
  }
};

/**
 * Temporarily flashes document title to alert the user even if they are in another tab.
 */
let titleTimer = null;
export const flashTabTitle = (alertText = '🔔 New Message!') => {
  try {
    if (titleTimer) clearTimeout(titleTimer);

    const originalTitle = 'BookLeaf Publishing — Author Support Hub';
    document.title = alertText;

    titleTimer = setTimeout(() => {
      document.title = originalTitle;
    }, 4500);
  } catch (err) {
    console.debug('[Title] Failed to flash tab title:', err);
  }
};
