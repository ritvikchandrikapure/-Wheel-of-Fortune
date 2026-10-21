import { useCallback, useRef, useState } from 'react'

// Tiny WebAudio synth: no audio files needed.
export function useSound() {
  const ctxRef = useRef(null)
  const onRef = useRef(true)
  const [on, setOn] = useState(true)

  const ctx = () => {
    if (!onRef.current) return null
    if (!ctxRef.current) {
      const C = window.AudioContext || window.webkitAudioContext
      if (!C) return null
      ctxRef.current = new C()
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }

  const beep = (freq, dur, type = 'sine', vol = 0.08, delay = 0) => {
    const c = ctx()
    if (!c) return
    const t = c.currentTime + delay
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(c.destination)
    o.start(t)
    o.stop(t + dur)
  }

  const tick = useCallback(() => beep(900, 0.04, 'square', 0.03), [])
  const start = useCallback(() => beep(300, 0.12, 'triangle', 0.08), [])
  const win = useCallback(() => {
    ;[523, 659, 784, 1047, 1319].forEach((f, i) => beep(f, 0.25, 'triangle', 0.09, i * 0.09))
  }, [])
  const lose = useCallback(() => {
    ;[330, 262, 196].forEach((f, i) => beep(f, 0.3, 'sawtooth', 0.045, i * 0.14))
  }, [])
  const toggle = useCallback(() => {
    onRef.current = !onRef.current
    setOn(onRef.current)
  }, [])

  return { on, tick, start, win, lose, toggle }
}
