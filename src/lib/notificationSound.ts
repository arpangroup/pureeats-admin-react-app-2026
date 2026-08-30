/** A short two-tone chime synthesized via the Web Audio API — no external asset to bundle or fail to load. */
export function playNewOrderChime(): void {
  try {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return
    const ctx = new AudioContextCtor()

    const playTone = (frequency: number, startOffset: number, duration: number) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      const startAt = ctx.currentTime + startOffset
      gain.gain.setValueAtTime(0, startAt)
      gain.gain.linearRampToValueAtTime(0.25, startAt + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(startAt)
      oscillator.stop(startAt + duration + 0.05)
    }

    playTone(880, 0, 0.18)
    playTone(1174.66, 0.16, 0.22)

    setTimeout(() => ctx.close().catch(() => {}), 700)
  } catch {
    // Autoplay can be blocked before the user has interacted with the page at all — the visible toast still shows.
  }
}
