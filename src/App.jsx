import { useCallback, useEffect, useRef, useState } from 'react'
import Wheel, { SEGMENTS } from './components/Wheel.jsx'
import Confetti from './components/Confetti.jsx'
import ResultDialog from './components/ResultDialog.jsx'
import { useSound } from './hooks/useSound.js'

const N = SEGMENTS.length
const SEG = 360 / N
const PAYOUT = 8
const BETS = [10, 25, 50, 100]
const START_COINS = 100
const KEY = 'wheel-of-fortune-v1'

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}

export default function App() {
  const saved = useRef(load()).current
  const sound = useSound()

  const [balance, setBalance] = useState(saved.balance ?? START_COINS)
  const [bet, setBet] = useState(10)
  const [pick, setPick] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [duration, setDuration] = useState(6000)
  const [phase, setPhase] = useState('idle') // idle | spinning
  const [result, setResult] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [history, setHistory] = useState(saved.history || [])
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(saved.best || 0)
  const [stats, setStats] = useState(saved.stats || { wins: 0, spins: 0 })
  const [burst, setBurst] = useState(0)

  const rotorRef = useRef(null)
  const pointerRef = useRef(null)
  const spinRef = useRef(null)
  const streakRef = useRef(0)
  const timerRef = useRef(null)
  const dialogTimer = useRef(null)

  const spinning = phase === 'spinning'
  const broke = balance < BETS[0] && !spinning

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ balance, history, best, stats })) } catch { }
  }, [balance, history, best, stats])

  useEffect(() => () => { clearTimeout(timerRef.current); clearTimeout(dialogTimer.current) }, [])

  // keep bet affordable
  useEffect(() => {
    if (spinning) return
    if (bet > balance && balance >= BETS[0]) {
      setBet([...BETS].reverse().find((b) => b <= balance))
    }
  }, [balance, bet, spinning])

  const flick = () => {
    pointerRef.current?.animate(
      [{ transform: 'translateX(-50%) rotate(0deg)' }, { transform: 'translateX(-50%) rotate(-16deg)' }, { transform: 'translateX(-50%) rotate(0deg)' }],
      { duration: 110, easing: 'ease-out' }
    )
  }

  // tick sound + pointer flick as segments pass the pointer
  useEffect(() => {
    if (!spinning) return
    let raf
    let last = null
    const loop = () => {
      const el = rotorRef.current
      if (el) {
        const m = new DOMMatrixReadOnly(getComputedStyle(el).transform)
        const ang = (Math.atan2(m.b, m.a) * 180) / Math.PI
        const v = Math.floor(((((-ang) % 360) + 360) % 360 + SEG / 2) / SEG)
        if (last !== null && v !== last) { sound.tick(); flick() }
        last = v
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [spinning, sound])

  const finish = useCallback(() => {
    const info = spinRef.current
    if (!info || info.done) return
    info.done = true
    clearTimeout(timerRef.current)

    const won = info.landed === info.pick
    const d = Math.abs(info.landed - info.pick)
    const close = !won && Math.min(d, N - d) === 1
    const payout = won ? info.bet * PAYOUT : 0

    streakRef.current = won ? streakRef.current + 1 : 0
    setStreak(streakRef.current)
    setBest((b) => Math.max(b, streakRef.current))
    setBalance((b) => b + payout)
    setStats((s) => ({ wins: s.wins + (won ? 1 : 0), spins: s.spins + 1 }))
    setHistory((h) => [{ id: Date.now(), landed: info.landed, pick: info.pick, won }, ...h].slice(0, 12))
    setResult({ landed: info.landed, pick: info.pick, bet: info.bet, won, close, payout })
    setPhase('idle')
    if (won) { setBurst((n) => n + 1); sound.win() } else sound.lose()
    dialogTimer.current = setTimeout(() => setShowResult(true), 450)
  }, [sound])

  const spin = () => {
    if (spinning || pick === null || bet > balance) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const idx = Math.floor(Math.random() * N)
    const jitter = (Math.random() - 0.5) * SEG * 0.7
    const target = -(idx * SEG) + jitter
    const cur = ((rotation % 360) + 360) % 360
    const delta = (((target - cur) % 360) + 360) % 360
    const dur = reduce ? 700 : 6000

    clearTimeout(dialogTimer.current)
    spinRef.current = { landed: idx + 1, pick, bet, done: false }
    sound.start()
    setBalance((b) => b - bet)
    setResult(null)
    setShowResult(false)
    setDuration(dur)
    setRotation(rotation + 360 * (reduce ? 1 : 7) + delta)
    setPhase('spinning')
    timerRef.current = setTimeout(finish, dur + 500)
  }

  const refill = () => { setBalance(START_COINS); setShowResult(false) }
  const again = () => {
    setShowResult(false)
    if (balance < BETS[0]) return refill()
    if (balance >= bet) spin()
  }
  const winRate = stats.spins ? Math.round((stats.wins / stats.spins) * 100) : 0

  let label = 'Pick a number to spin'
  if (spinning) label = 'Spinning…'
  else if (broke) label = 'Refill coins'
  else if (pick !== null) label = `Spin · bet ${bet} on ${pick}`

  return (
    <div className="app">
      <Confetti fire={burst} />

      <header className="top">
        <h1 className="logo">Wheel of Fortune</h1>
        <div className="top-right">
          <div className="coins" aria-label={`${balance} coins`}>
            <span className="coin" aria-hidden="true" />
            <b key={balance}>{balance}</b>
          </div>
          <button className="icon-btn" onClick={sound.toggle} aria-pressed={sound.on} aria-label="Toggle sound">
            {sound.on ? '🔊' : '🔇'}
          </button>
        </div>
      </header>

      <main className="game">
        <section className="stage-wrap" aria-label="Wheel">
          <div className="stage">
            <div className="pointer" ref={pointerRef} aria-hidden="true" />
            <Wheel rotation={rotation} duration={duration} spinning={spinning} rotorRef={rotorRef} onEnd={finish} />
          </div>
        </section>

        <section className="panel">
          <p className="hint-line">
            {pick !== null
              ? <>Lands on <b>{pick}</b>? You win <b>{bet * PAYOUT}</b> coins</>
              : <>Pick a number. A hit pays <b>{PAYOUT}×</b></>}
          </p>

          <div className="group">
            <h2>Your number</h2>
            <div className="picks">
              {SEGMENTS.map((s) => (
                <button
                  key={s.n}
                  className={`pick ${pick === s.n ? 'on' : ''}`}
                  style={{ '--c': s.c, '--t': s.t }}
                  onClick={() => setPick(s.n)}
                  disabled={spinning}
                  aria-pressed={pick === s.n}
                  aria-label={`Number ${s.n}`}
                >
                  {s.n}
                </button>
              ))}
            </div>
          </div>

          <div className="group">
            <h2>Your bet</h2>
            <div className="chips">
              {BETS.map((b) => (
                <button
                  key={b}
                  className={`chip ${bet === b ? 'on' : ''}`}
                  onClick={() => setBet(b)}
                  disabled={spinning || b > balance}
                  aria-pressed={bet === b}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <button
            className="spin"
            onClick={broke ? refill : spin}
            disabled={!broke && (spinning || pick === null || bet > balance)}
          >
            {label}
          </button>

          <div className="stats">
            <div><b>{streak}</b><span>Streak</span></div>
            <div><b>{best}</b><span>Best</span></div>
            <div><b>{winRate}%</b><span>Win rate</span></div>
          </div>

          {history.length > 0 && (
            <ol className="history" aria-label="Recent spins">
              {history.map((h) => (
                <li
                  key={h.id}
                  className={h.won ? 'w' : ''}
                  style={{ '--c': SEGMENTS[h.landed - 1].c }}
                  title={h.won ? `Won on ${h.landed}` : `Landed ${h.landed}, picked ${h.pick}`}
                >
                  {h.landed}
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>

      {showResult && result && (
        <ResultDialog
          result={result}
          balance={balance}
          streak={streak}
          minBet={BETS[0]}
          onAgain={again}
          onClose={() => setShowResult(false)}
        />
      )}
    </div>
  )
}
