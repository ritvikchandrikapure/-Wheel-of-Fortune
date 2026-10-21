import { useEffect, useRef } from 'react'

const COLORS = ['#ff4f8b', '#ffcf4a', '#2ee6c5', '#6c63ff', '#ff7a3d', '#3ddc84', '#4db5ff']

// Fires a burst every time `fire` changes (and is > 0).
export default function Confetti({ fire }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!fire) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const cv = ref.current
    const ctx = cv.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const W = (cv.width = window.innerWidth * dpr)
    const H = (cv.height = window.innerHeight * dpr)
    const parts = Array.from({ length: 170 }, () => {
      const a = Math.random() * Math.PI * 2
      const s = (6 + Math.random() * 12) * dpr
      return {
        x: W / 2, y: H * 0.42,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - 8 * dpr,
        w: (6 + Math.random() * 7) * dpr, h: (4 + Math.random() * 5) * dpr,
        r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        c: COLORS[(Math.random() * COLORS.length) | 0],
      }
    })
    let raf
    const t0 = performance.now()
    const frame = (t) => {
      const age = t - t0
      ctx.clearRect(0, 0, W, H)
      parts.forEach((p) => {
        p.vy += 0.35 * dpr
        p.vx *= 0.99
        p.x += p.vx; p.y += p.vy; p.r += p.vr
        ctx.save()
        ctx.globalAlpha = Math.max(0, 1 - age / 3200)
        ctx.translate(p.x, p.y); ctx.rotate(p.r)
        ctx.fillStyle = p.c
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      if (age < 3200) raf = requestAnimationFrame(frame)
      else ctx.clearRect(0, 0, W, H)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [fire])

  return <canvas ref={ref} className="confetti" aria-hidden="true" />
}
