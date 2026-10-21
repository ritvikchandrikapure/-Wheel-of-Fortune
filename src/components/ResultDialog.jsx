import { useEffect, useRef, useState } from 'react'
import { SEGMENTS } from './Wheel.jsx'

function useCountUp(target, ms = 800) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf
    const t0 = performance.now()
    const f = (t) => {
      const p = Math.min(1, (t - t0) / ms)
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(f)
    }
    raf = requestAnimationFrame(f)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export default function ResultDialog({ result, balance, streak, minBet, onAgain, onClose }) {
  const primaryRef = useRef(null)
  const boxRef = useRef(null)
  const { won, landed, pick, bet, payout, close } = result
  const seg = SEGMENTS[landed - 1]
  const amount = useCountUp(won ? payout : bet)
  const broke = balance < minBet
  const canAgain = balance >= bet

  useEffect(() => { primaryRef.current?.focus() }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        const f = boxRef.current.querySelectorAll('button')
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const title = won ? 'YOU WIN!' : close ? 'SO CLOSE!' : 'NOT THIS TIME'
  const sub = won
    ? `The wheel stopped on ${landed}, your lucky number!`
    : `The wheel stopped on ${landed}. You picked ${pick}.`
  const primary = broke ? 'Refill coins' : canAgain ? `Spin again · ${bet}` : 'Change bet'

  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`dlg ${won ? 'win' : 'loss'}`} role="dialog" aria-modal="true" aria-labelledby="dlg-title" ref={boxRef}>
        <div className="badge-wrap">
          {won && <span className="burst" aria-hidden="true" />}
          <div className="badge" style={{ background: seg.c, color: seg.t }}>{landed}</div>
        </div>

        <h2 id="dlg-title" className="dlg-title">{title}</h2>
        <p className="dlg-sub">{sub}</p>

        <div className="amount">
          <span className="coin" aria-hidden="true" />
          <b>{won ? '+' : '−'}{amount}</b>
          <span className="unit">coins</span>
        </div>

        {won && streak >= 2 && <p className="streak-tag">🔥 {streak} wins in a row!</p>}
        {!won && <p className="dlg-tip">Every spin is a fresh chance.</p>}
        <p className="dlg-bal">Balance: <b>{balance}</b> coins</p>

        <div className="dlg-actions">
          <button ref={primaryRef} className="spin" onClick={canAgain || broke ? onAgain : onClose}>{primary}</button>
          <button className="ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
