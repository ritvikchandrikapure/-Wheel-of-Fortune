export const SEGMENTS = [
  { n: 1, c: '#ff4f8b', t: '#1a0f2e' },
  { n: 2, c: '#ffb703', t: '#1a0f2e' },
  { n: 3, c: '#2ee6c5', t: '#1a0f2e' },
  { n: 4, c: '#6c63ff', t: '#ffffff' },
  { n: 5, c: '#ff7a3d', t: '#1a0f2e' },
  { n: 6, c: '#3ddc84', t: '#1a0f2e' },
  { n: 7, c: '#4db5ff', t: '#1a0f2e' },
  { n: 8, c: '#c04dff', t: '#ffffff' },
]

const N = SEGMENTS.length
const SEG = 360 / N
const C = 220
const R = 178

const pt = (deg, r) => {
  const a = (deg * Math.PI) / 180
  return [C + r * Math.sin(a), C - r * Math.cos(a)]
}

export default function Wheel({ rotation, duration, spinning, rotorRef, onEnd }) {
  return (
    <svg
      className={`wheel ${spinning ? 'spinning' : ''}`}
      viewBox="0 0 440 440"
      role="img"
      aria-label="Wheel of fortune with numbers 1 to 8"
    >
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff2b0" />
          <stop offset=".5" stopColor="#ffb703" />
          <stop offset="1" stopColor="#b9730a" />
        </linearGradient>
        <radialGradient id="shine" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset=".7" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".3" />
        </radialGradient>
      </defs>

      <circle cx={C} cy={C} r="216" fill="url(#gold)" />
      <circle cx={C} cy={C} r="208" fill="#2a1650" />

      {Array.from({ length: 24 }, (_, i) => {
        const [x, y] = pt(i * 15, 198)
        return <circle key={i} className={`bulb ${i % 2 ? 'b' : ''}`} cx={x} cy={y} r="5.5" />
      })}

      <g
        ref={rotorRef}
        className="rotor"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? `transform ${duration}ms cubic-bezier(.12,.6,.08,1)` : 'none',
        }}
        onTransitionEnd={onEnd}
      >
        {SEGMENTS.map((s, i) => {
          const [x0, y0] = pt(i * SEG - SEG / 2, R)
          const [x1, y1] = pt(i * SEG + SEG / 2, R)
          return (
            <g key={s.n}>
              <path
                d={`M${C} ${C} L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z`}
                fill={s.c}
                stroke="#150d28"
                strokeOpacity=".55"
                strokeWidth="2"
              />
              <text
                x={C}
                y={C - R * 0.7}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${i * SEG} ${C} ${C})`}
                fontFamily="Bungee, Impact, sans-serif"
                fontSize="36"
                fill={s.t}
              >
                {s.n}
              </text>
            </g>
          )
        })}
      </g>

      <circle cx={C} cy={C} r={R} fill="url(#shine)" pointerEvents="none" />
      <circle cx={C} cy={C} r={R + 1} fill="none" stroke="url(#gold)" strokeWidth="4" />
      <circle cx={C} cy={C} r="36" fill="url(#gold)" />
      <circle cx={C} cy={C} r="26" fill="#2a1650" />
      <text x={C} y={C} textAnchor="middle" dominantBaseline="central" fontSize="26" fill="#ffcf4a">★</text>
    </svg>
  )
}
