import { useEffect, useRef } from 'react'

const PI2 = Math.PI * 2
const W = 160
const R = 52

function rand(a, b) { return a + Math.random() * (b - a) }

function lerpColor(stops, t) {
  t = Math.max(0, Math.min(1, t))
  const seg = t * (stops.length - 1)
  const i = Math.floor(Math.min(seg, stops.length - 2))
  const f = seg - i
  const a = stops[i], b = stops[i + 1]
  return [(a[0] + (b[0] - a[0]) * f) | 0, (a[1] + (b[1] - a[1]) * f) | 0, (a[2] + (b[2] - a[2]) * f) | 0]
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [(hue2rgb(p, q, h + 1 / 3) * 255) | 0, (hue2rgb(p, q, h) * 255) | 0, (hue2rgb(p, q, h - 1 / 3) * 255) | 0]
}

const CONFIGS = {
  Fire: {
    count: 180,
    blend: 'lighter',
    colorStops: [[255, 255, 220], [255, 210, 30], [255, 80, 0], [180, 20, 0], [60, 0, 0]],
    spawn(cx, cy) {
      const a = rand(0, PI2)
      const d = R + rand(-10, 10)
      const speed = rand(0.6, 2.0)
      return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a), vx: Math.cos(a) * rand(-0.2, 0.3), vy: Math.sin(a) * rand(-0.1, 0.15) - speed, maxLife: rand(14, 40), size: rand(3, 9) }
    },
    update(p) {
      p.vy -= 0.045; p.vx += rand(-0.14, 0.14)
      p.x += p.vx; p.y += p.vy; p.size *= 0.968
    },
  },
  Ice: {
    count: 80,
    blend: 'lighter',
    colorStops: [[255, 255, 255], [190, 240, 255], [80, 185, 255], [20, 100, 220]],
    spawn(cx, cy) {
      const a = rand(0, PI2)
      const d = R + rand(-7, 7)
      return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a), vx: rand(-0.2, 0.2), vy: rand(-0.2, 0.2), maxLife: rand(40, 90), size: rand(1.5, 4) }
    },
    update(p) {
      p.x += p.vx + rand(-0.07, 0.07); p.y += p.vy + rand(-0.07, 0.07); p.size *= 0.994
    },
  },
  Electric: {
    count: 65,
    blend: 'lighter',
    colorStops: [[255, 255, 255], [255, 255, 170], [255, 240, 0], [160, 160, 255]],
    spawn(cx, cy) {
      const a = rand(0, PI2)
      const d = R + rand(-12, 12)
      const dir = rand(0, PI2)
      const speed = rand(2, 5)
      return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a), vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed, maxLife: rand(3, 12), size: rand(1, 2.5) }
    },
    update(p) { p.vx *= 0.84; p.vy *= 0.84; p.x += p.vx; p.y += p.vy },
  },
  Wind: {
    count: 110,
    blend: 'lighter',
    colorStops: [[255, 255, 255], [200, 255, 230], [80, 255, 165], [20, 190, 90]],
    spawn(cx, cy) {
      const a = rand(0, PI2)
      const d = R + rand(-8, 8)
      const tangent = a + PI2 / 4
      const speed = rand(0.5, 1.3)
      return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a), vx: Math.cos(tangent) * speed, vy: Math.sin(tangent) * speed, maxLife: rand(28, 65), size: rand(2, 5), cx, cy }
    },
    update(p) {
      p.x += p.vx; p.y += p.vy
      const dx = p.x - p.cx, dy = p.y - p.cy, d = Math.sqrt(dx * dx + dy * dy) || 1
      p.vx += dx / d * 0.027; p.vy += dy / d * 0.027
      p.vx *= 0.99; p.vy *= 0.99; p.size *= 0.985
    },
  },
  Nuclear: {
    count: 95,
    blend: 'lighter',
    colorStops: [[255, 255, 180], [190, 255, 70], [80, 220, 0], [30, 130, 0]],
    spawn(cx, cy) {
      const a = rand(0, PI2)
      const d = R + rand(-8, 8)
      const speed = rand(0.2, 0.85)
      return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a), vx: Math.cos(a) * rand(-0.2, 0.2), vy: Math.sin(a) * rand(-0.2, 0.2) - speed * 0.4, maxLife: rand(28, 58), size: rand(2, 6) }
    },
    update(p) {
      p.x += p.vx; p.y += p.vy; p.vx += rand(-0.05, 0.05); p.vy -= 0.013; p.size *= 0.982
    },
  },
  Curse: {
    count: 90,
    blend: 'source-over',
    colorStops: [[200, 180, 255], [160, 60, 255], [100, 0, 200], [40, 0, 90]],
    spawn(cx, cy) {
      const a = rand(0, PI2)
      const d = R + rand(-7, 7)
      const speed = rand(0.2, 0.6)
      return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a), vx: rand(-0.2, 0.2), vy: -speed * rand(0.3, 0.9), maxLife: rand(35, 72), size: rand(3, 7.5) }
    },
    update(p) {
      p.x += p.vx + rand(-0.09, 0.09); p.y += p.vy; p.vy += 0.004; p.size *= 0.984
    },
  },
  Bless: {
    count: 90,
    blend: 'lighter',
    colorStops: [[255, 255, 255], [255, 255, 210], [255, 220, 80], [255, 170, 0]],
    spawn(cx, cy) {
      const a = rand(0, PI2)
      const d = R + rand(-6, 6)
      return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a), vx: rand(-0.15, 0.15), vy: -rand(0.25, 0.9), maxLife: rand(28, 58), size: rand(1.5, 4) }
    },
    update(p) {
      p.x += p.vx + rand(-0.05, 0.05); p.y += p.vy; p.size *= 0.987
    },
  },
  Physical: {
    count: 90,
    blend: 'lighter',
    colorStops: [[255, 215, 195], [255, 130, 70], [200, 60, 10], [110, 20, 0]],
    spawn(cx, cy) {
      const a = rand(0, PI2)
      const d = R + rand(-8, 8)
      const speed = rand(0.4, 1.3)
      return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a), vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, maxLife: rand(18, 40), size: rand(2, 6) }
    },
    update(p) {
      p.x += p.vx; p.y += p.vy; p.vx *= 0.93; p.vy *= 0.93; p.size *= 0.97
    },
  },
  Almighty: {
    count: 110,
    blend: 'lighter',
    colorStops: null,
    spawn(cx, cy) {
      const a = rand(0, PI2)
      const d = R + rand(-7, 7)
      const tangent = a + PI2 / 4 * (Math.random() > 0.5 ? 1 : -1)
      const speed = rand(0.4, 1.3)
      return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a), vx: Math.cos(tangent) * speed, vy: Math.sin(tangent) * speed, maxLife: rand(24, 55), size: rand(2, 5.5), hue: rand(0, 360) }
    },
    update(p) {
      p.x += p.vx; p.y += p.vy; p.vx *= 0.982; p.vy *= 0.982; p.size *= 0.981; p.hue = (p.hue + 2.5) % 360
    },
  },
  Psychokinesis: {
    count: 100,
    blend: 'lighter',
    colorStops: [[255, 190, 255], [220, 90, 255], [170, 0, 255], [70, 0, 190]],
    spawn(cx, cy) {
      const a = rand(0, PI2)
      const d = R + rand(-7, 7)
      const tangent = a + PI2 / 4
      const speed = rand(0.6, 1.6)
      return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a), vx: Math.cos(tangent) * speed, vy: Math.sin(tangent) * speed, maxLife: rand(22, 50), size: rand(2, 5.5), cx, cy }
    },
    update(p) {
      p.x += p.vx; p.y += p.vy
      const dx = p.cx - p.x, dy = p.cy - p.y, d = Math.sqrt(dx * dx + dy * dy) || 1
      p.vx += dx / d * 0.1; p.vy += dy / d * 0.1; p.vx *= 0.97; p.vy *= 0.97; p.size *= 0.981
    },
  },
}

export default function ElementRing({ element }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!element || element === '-') return
    const cfg = CONFIGS[element]
    if (!cfg) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cx = W / 2, cy = W / 2

    const particles = Array.from({ length: cfg.count }, () => {
      const p = cfg.spawn(cx, cy)
      p.life = Math.random() * p.maxLife
      return p
    })

    let animId

    function draw() {
      ctx.clearRect(0, 0, W, W)
      ctx.globalCompositeOperation = cfg.blend

      for (const p of particles) {
        p.life++
        if (p.life >= p.maxLife) {
          Object.assign(p, cfg.spawn(cx, cy))
          p.life = 0
        }
        cfg.update(p, cx, cy)

        const t = p.life / p.maxLife
        const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85
        if (alpha <= 0) continue

        let rc, gc, bc
        if (cfg.colorStops) {
          ;[rc, gc, bc] = lerpColor(cfg.colorStops, t)
        } else {
          ;[rc, gc, bc] = hslToRgb(p.hue, 100, 72)
        }

        const sz = Math.max(0.5, p.size)
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz)
        grd.addColorStop(0, `rgba(${rc},${gc},${bc},${alpha.toFixed(2)})`)
        grd.addColorStop(0.45, `rgba(${rc},${gc},${bc},${(alpha * 0.3).toFixed(2)})`)
        grd.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(p.x, p.y, sz, 0, PI2)
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [element])

  if (!element || element === '-') return null

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={W}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
