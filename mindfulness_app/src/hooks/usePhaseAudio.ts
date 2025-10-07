import { useCallback, useRef } from "react";

const PHASE_FREQUENCIES = [520, 440, 360, 600, 300, 660];
const DURATION_MS = 220;

export function usePhaseAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const ensureContext = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    if (!audioCtxRef.current) {
      const win = window as typeof window & { webkitAudioContext?: typeof AudioContext };
      const AudioCtor = win.AudioContext ?? win.webkitAudioContext;
      if (!AudioCtor) {
        return null;
      }
      const ctx = new AudioCtor();
      const gain = ctx.createGain();
      gain.gain.value = 0.08;
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = gain;
    }
    return audioCtxRef.current;
  }, []);

  const playPhaseTone = useCallback(
    (phaseIndex: number) => {
      const ctx = ensureContext();
      const masterGain = masterGainRef.current;
      if (!ctx || !masterGain) {
        return;
      }

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const envelope = ctx.createGain();
      const freq = PHASE_FREQUENCIES[Math.max(0, phaseIndex) % PHASE_FREQUENCIES.length];
      const now = ctx.currentTime;
      const duration = DURATION_MS / 1000;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(1, now + 0.02);
      envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(envelope);
      envelope.connect(masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.02);
    },
    [ensureContext]
  );

  const resetAudio = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) {
      return;
    }
    if (ctx.state !== "closed") {
      ctx.suspend().catch(() => {});
    }
  }, []);

  return { playPhaseTone, resetAudio };
}
