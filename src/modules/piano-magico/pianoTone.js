// Shared by the existing piano synth and the Valley's non-evaluated preview.
export function playPianoTone(context, frequency, type = 'triangle', gain = .2, decay = .8) {
  if (!frequency || frequency === 0) return;
  const oscillator = context.createOscillator(), envelope = context.createGain();
  oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  envelope.gain.setValueAtTime(gain, context.currentTime);
  envelope.gain.exponentialRampToValueAtTime(.01, context.currentTime + decay);
  oscillator.connect(envelope); envelope.connect(context.destination);
  oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  oscillator.start(); oscillator.stop(context.currentTime + decay);
  return oscillator;
}
