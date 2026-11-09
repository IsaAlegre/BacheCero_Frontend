// Generador de códigos QR mínimo (modo byte, corrección M, versiones 1 a 10:
// alcanza para URLs de hasta ~210 caracteres). Escrito a mano para no sumar
// dependencias; sigue la norma ISO/IEC 18004 (basado en el enfoque de Nayuki).
// qrMatrix(texto) → matriz de booleanos (true = módulo oscuro).

// [codewords de corrección por bloque, [[cantidad de bloques, codewords de datos por bloque], ...]]
const BLOCKS_M = [
  null,
  [10, [[1, 16]]], [16, [[1, 28]]], [26, [[1, 44]]], [18, [[2, 32]]], [24, [[2, 43]]],
  [16, [[4, 27]]], [18, [[4, 31]]], [22, [[2, 38], [2, 39]]], [22, [[3, 36], [2, 37]]], [26, [[4, 43], [1, 44]]],
]
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]]

const dataCapacity = (v) => BLOCKS_M[v][1].reduce((a, [n, k]) => a + n * k, 0)

function gfMul(x, y) {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z & 0xff
}

function rsDivisor(degree) {
  const r = new Array(degree).fill(0)
  r[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      r[j] = gfMul(r[j], root)
      if (j + 1 < degree) r[j] ^= r[j + 1]
    }
    root = gfMul(root, 0x02)
  }
  return r
}

function rsRemainder(data, divisor) {
  const r = new Array(divisor.length).fill(0)
  for (const b of data) {
    const factor = b ^ r.shift()
    r.push(0)
    divisor.forEach((d, i) => { r[i] ^= gfMul(d, factor) })
  }
  return r
}

function encodeData(bytes, version) {
  const bits = []
  const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1) }
  push(0b0100, 4) // modo byte
  push(bytes.length, version < 10 ? 8 : 16)
  bytes.forEach((b) => push(b, 8))
  const capBits = dataCapacity(version) * 8
  push(0, Math.min(4, capBits - bits.length))
  push(0, (8 - (bits.length % 8)) % 8)
  for (let pad = 0xec; bits.length < capBits; pad ^= 0xec ^ 0x11) push(pad, 8)
  const out = []
  for (let i = 0; i < bits.length; i += 8) out.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0))
  return out
}

function addEcAndInterleave(data, version) {
  const [ecLen, groups] = BLOCKS_M[version]
  const divisor = rsDivisor(ecLen)
  const blocks = []
  let k = 0
  groups.forEach(([n, len]) => {
    for (let i = 0; i < n; i++) {
      const d = data.slice(k, k + len)
      k += len
      blocks.push({ d, ec: rsRemainder(d, divisor) })
    }
  })
  const out = []
  const maxLen = Math.max(...blocks.map((b) => b.d.length))
  for (let i = 0; i < maxLen; i++) blocks.forEach((b) => i < b.d.length && out.push(b.d[i]))
  for (let i = 0; i < ecLen; i++) blocks.forEach((b) => out.push(b.ec[i]))
  return out
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

function build(version, codewords, mask) {
  const size = version * 4 + 17
  const m = Array.from({ length: size }, () => new Array(size).fill(false))
  const fn = Array.from({ length: size }, () => new Array(size).fill(false))
  const set = (x, y, dark) => { m[y][x] = dark; fn[y][x] = true }

  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0) }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy
        const d = Math.max(Math.abs(dx), Math.abs(dy))
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4)
      }
    }
  }
  const al = ALIGN[version]
  al.forEach((ax, i) => al.forEach((ay, j) => {
    const last = al.length - 1
    if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
  }))

  // Formato (corrección M = 00) y versión (v ≥ 7).
  const fdata = (0 << 3) | mask
  let rem = fdata
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  const fbits = ((fdata << 10) | rem) ^ 0x5412
  const fb = (i) => ((fbits >>> i) & 1) === 1
  for (let i = 0; i <= 5; i++) set(8, i, fb(i))
  set(8, 7, fb(6)); set(8, 8, fb(7)); set(7, 8, fb(8))
  for (let i = 9; i < 15; i++) set(14 - i, 8, fb(i))
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, fb(i))
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, fb(i))
  set(8, size - 8, true)
  if (version >= 7) {
    let r = version
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25)
    const vbits = (version << 12) | r
    for (let i = 0; i < 18; i++) {
      const bit = ((vbits >>> i) & 1) === 1
      const a = size - 11 + (i % 3), b = Math.floor(i / 3)
      set(a, b, bit); set(b, a, bit)
    }
  }

  // Datos en zigzag, de abajo a la derecha hacia arriba.
  let i = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const upward = ((right + 1) & 2) === 0
        const y = upward ? size - 1 - vert : vert
        if (fn[y][x]) continue
        const bit = i < codewords.length * 8 ? ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) === 1 : false
        i++
        m[y][x] = bit !== MASKS[mask](x, y)
      }
    }
  }
  return m
}

// Penalización estándar para elegir la mejor máscara.
function penalty(m) {
  const size = m.length
  let p = 0
  const lines = []
  for (let y = 0; y < size; y++) lines.push(m[y])
  for (let x = 0; x < size; x++) lines.push(m.map((row) => row[x]))
  for (const line of lines) {
    let run = 1
    for (let k = 1; k <= size; k++) {
      if (k < size && line[k] === line[k - 1]) run++
      else { if (run >= 5) p += run - 2; run = 1 }
    }
    const s = line.map((b) => (b ? 1 : 0)).join('')
    p += 40 * ((s.match(/(?=10111010000)/g) || []).length + (s.match(/(?=00001011101)/g) || []).length)
  }
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = m[y][x]
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3
    }
  }
  const dark = m.flat().filter(Boolean).length
  const total = size * size
  p += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10
  return p
}

export function qrMatrix(text) {
  const bytes = [...new TextEncoder().encode(text)]
  let version = 1
  while (version <= 10 && dataCapacity(version) < bytes.length + (version < 10 ? 2 : 3)) version++
  if (version > 10) throw new Error('Texto demasiado largo para el QR')
  const codewords = addEcAndInterleave(encodeData(bytes, version), version)
  let best = null
  for (let mask = 0; mask < 8; mask++) {
    const m = build(version, codewords, mask)
    const p = penalty(m)
    if (!best || p < best.p) best = { m, p }
  }
  return best.m
}
