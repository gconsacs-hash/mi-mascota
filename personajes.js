/* ===== Mi Mascota — dibujos de los personajes =====
   Cada mascota se dibuja con código (SVG) en vez de imágenes fijas.
   Así puede cambiar de cara según su ánimo y ponerse ropa encima.
   Uso: Personajes.dibujar({ especie, etapa, animo, ropa, toques }) → texto SVG */

const Personajes = (() => {

  // Medidas de cada etapa dentro de un lienzo de 200×200.
  // cuerpo: óvalo del cuerpo. cabeza: círculo. ojos: altura, separación y tamaño.
  const ANCLAS = {
    bebe:   { cuerpo: { cx: 100, cy: 160, rx: 36, ry: 28 }, cabeza: { cx: 100, cy: 94, r: 46 }, ojos: { y: 94, sep: 18, r: 6.5 }, boca: { y: 111 }, patas: { y: 184 } },
    joven:  { cuerpo: { cx: 100, cy: 150, rx: 46, ry: 40 }, cabeza: { cx: 100, cy: 78, r: 42 }, ojos: { y: 74, sep: 16, r: 6 },   boca: { y: 91 },  patas: { y: 185 } },
    adulto: { cuerpo: { cx: 100, cy: 138, rx: 58, ry: 56 }, cabeza: { cx: 100, cy: 64, r: 40 }, ojos: { y: 57, sep: 14, r: 5.2 }, boca: { y: 75 },  patas: { y: 184 } },
  };

  const n = (v) => Math.round(v * 10) / 10;
  const borde = (p) => p.borde ? `stroke="${p.borde}" stroke-width="1.5"` : "";

  /* ---------- Huevo ---------- */
  function huevo(p, toques = 0) {
    const grietas = toques >= 7 ? 2 : toques >= 4 ? 1 : 0;
    let s = `<ellipse cx="100" cy="188" rx="50" ry="8" fill="#000" opacity=".08"/>
      <path d="M100 28 C 62 28 46 90 46 126 C 46 166 70 186 100 186 C 130 186 154 166 154 126 C 154 90 138 28 100 28 Z" fill="${p.piel}" ${borde(p) || `stroke="${p.oscuro}" stroke-width="1.5" stroke-opacity=".35"`}/>
      <ellipse cx="78" cy="90" rx="9" ry="16" fill="#fff" opacity=".45" transform="rotate(-12 78 90)"/>
      <circle cx="120" cy="80" r="9" fill="${p.oscuro}" opacity=".55"/>
      <circle cx="82" cy="130" r="11" fill="${p.oscuro}" opacity=".55"/>
      <circle cx="122" cy="145" r="7" fill="${p.oscuro}" opacity=".55"/>
      <circle cx="100" cy="112" r="6" fill="${p.detalle}" opacity=".7"/>`;
    if (grietas >= 1) s += `<path d="M 96 60 l 8 10 l -7 9 l 9 8" stroke="#3b3b3b" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (grietas >= 2) s += `<path d="M 60 120 l 10 6 l -4 10 l 12 5" stroke="#3b3b3b" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 140 100 l -9 8 l 6 9" stroke="#3b3b3b" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    return s;
  }

  /* ---------- Partes comunes ---------- */
  function cuerpo(a, p) {
    const c = a.cuerpo;
    const bx = c.cx - c.rx * 0.8, by = c.cy + c.ry * 0.05;
    const bx2 = c.cx + c.rx * 0.8;
    return `
      <ellipse cx="100" cy="${a.patas.y + 6}" rx="${n(c.rx * 1.1)}" ry="8" fill="#000" opacity=".08"/>
      <ellipse cx="${c.cx}" cy="${c.cy}" rx="${c.rx}" ry="${c.ry}" fill="${p.piel}" ${borde(p)}/>
      <ellipse cx="${c.cx}" cy="${n(c.cy + c.ry * 0.18)}" rx="${n(c.rx * 0.62)}" ry="${n(c.ry * 0.6)}" fill="${p.panza}"/>
      <ellipse cx="${n(bx)}" cy="${n(by)}" rx="${n(c.rx * 0.26)}" ry="${n(c.ry * 0.42)}" fill="${p.piel}" transform="rotate(24 ${n(bx)} ${n(by)})" ${borde(p)}/>
      <ellipse cx="${n(bx2)}" cy="${n(by)}" rx="${n(c.rx * 0.26)}" ry="${n(c.ry * 0.42)}" fill="${p.piel}" transform="rotate(-24 ${n(bx2)} ${n(by)})" ${borde(p)}/>`;
  }

  function patas(a, p) {
    const c = a.cuerpo;
    return `
      <ellipse cx="${n(c.cx - c.rx * 0.48)}" cy="${a.patas.y}" rx="${n(c.rx * 0.36)}" ry="10" fill="${p.oscuro}"/>
      <ellipse cx="${n(c.cx + c.rx * 0.48)}" cy="${a.patas.y}" rx="${n(c.rx * 0.36)}" ry="10" fill="${p.oscuro}"/>`;
  }

  function cabeza(a, p) {
    const h = a.cabeza;
    return `<circle cx="${h.cx}" cy="${h.cy}" r="${h.r}" fill="${p.piel}" ${borde(p)}/>`;
  }

  // Ojos, boca y mejillas según el ánimo: feliz, normal, triste o dormido
  function cara(a, p, animo, especie) {
    const { y, sep, r } = a.ojos;
    const hx = a.cabeza.cx;
    const by = a.boca.y;
    const ojoIzq = hx - sep, ojoDer = hx + sep;
    let s = "";

    if (especie === "panda") {
      s += `<ellipse cx="${ojoIzq}" cy="${y + 1}" rx="${n(r * 1.9)}" ry="${n(r * 1.5)}" fill="#2b2b2b" transform="rotate(-15 ${ojoIzq} ${y})"/>
            <ellipse cx="${ojoDer}" cy="${y + 1}" rx="${n(r * 1.9)}" ry="${n(r * 1.5)}" fill="#2b2b2b" transform="rotate(15 ${ojoDer} ${y})"/>`;
    }

    // Ojos
    if (animo === "dormido") {
      const ojoCerrado = (x) => `<path d="M ${n(x - r)} ${y} q ${r} ${n(r * 1.1)} ${n(r * 2)} 0" stroke="#2b2b2b" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      s += ojoCerrado(ojoIzq) + ojoCerrado(ojoDer);
    } else {
      const ojo = (x) => {
        let o = "";
        if (especie === "panda") o += `<circle cx="${x}" cy="${y}" r="${n(r * 1.05)}" fill="#fff"/>`;
        o += `<circle cx="${x}" cy="${y}" r="${r}" fill="#2b2b2b"/>
              <circle cx="${n(x + r * 0.35)}" cy="${n(y - r * 0.35)}" r="${n(r * 0.36)}" fill="#fff"/>`;
        return o;
      };
      s += ojo(ojoIzq) + ojo(ojoDer);
      if (animo === "triste") {
        // Cejas de pena: el lado de adentro va más arriba
        s += `<path d="M ${n(ojoIzq - r * 1.3)} ${n(y - r * 1.2)} l ${n(r * 2)} ${n(-r * 0.7)}" stroke="#2b2b2b" stroke-width="2.2" stroke-linecap="round"/>
              <path d="M ${n(ojoDer + r * 1.3)} ${n(y - r * 1.2)} l ${n(-r * 2)} ${n(-r * 0.7)}" stroke="#2b2b2b" stroke-width="2.2" stroke-linecap="round"/>
              <ellipse cx="${n(ojoDer + r * 0.6)}" cy="${n(y + r * 2.1)}" rx="2.4" ry="4" fill="#5ec8ff"/>`;
      }
    }

    // Nariz según especie
    if (especie === "gato" || especie === "conejo") {
      s += `<path d="M ${hx - 3.5} ${by - 4} l 7 0 l -3.5 4 z" fill="${especie === "gato" ? "#e98a9a" : "#f08ca0"}"/>`;
    } else if (especie === "perro" || especie === "zorro" || especie === "panda") {
      s += `<ellipse cx="${hx}" cy="${by - 4}" rx="4.5" ry="3.2" fill="#2b2b2b"/>`;
    } else if (especie === "dragon") {
      s += `<circle cx="${hx - 5}" cy="${by - 5}" r="1.8" fill="${p.oscuro}"/><circle cx="${hx + 5}" cy="${by - 5}" r="1.8" fill="${p.oscuro}"/>`;
    }

    // Boca
    const ancho = r * 1.7;
    if (animo === "feliz") {
      s += `<path d="M ${n(hx - ancho)} ${by} Q ${hx} ${n(by + r * 2.4)} ${n(hx + ancho)} ${by} Z" fill="#b8324f"/>
            <ellipse cx="${hx}" cy="${n(by + r * 1.1)}" rx="${n(r * 0.9)}" ry="${n(r * 0.6)}" fill="#ff8da1"/>`;
    } else if (animo === "triste") {
      s += `<path d="M ${n(hx - ancho * 0.8)} ${by + 4} Q ${hx} ${n(by - r * 0.9)} ${n(hx + ancho * 0.8)} ${by + 4}" stroke="${p.oscuro === "#2b2b2b" ? "#555" : p.oscuro}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    } else if (animo === "dormido") {
      s += `<ellipse cx="${hx}" cy="${by + 2}" rx="3" ry="3.6" fill="#b8324f" opacity=".8"/>`;
    } else {
      s += `<path d="M ${n(hx - ancho * 0.8)} ${by - 2} Q ${hx} ${n(by + r * 1.1)} ${n(hx + ancho * 0.8)} ${by - 2}" stroke="${p.oscuro === "#2b2b2b" ? "#555" : p.oscuro}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    }

    // Dientes del conejo y lengua del perro
    if (especie === "conejo" && animo !== "dormido") {
      s += `<rect x="${hx - 4}" y="${by + (animo === "feliz" ? 0 : -1)}" width="3.6" height="6" rx="1" fill="#fff" stroke="#ccc" stroke-width=".5"/>
            <rect x="${hx + 0.4}" y="${by + (animo === "feliz" ? 0 : -1)}" width="3.6" height="6" rx="1" fill="#fff" stroke="#ccc" stroke-width=".5"/>`;
    }
    if (especie === "perro" && animo === "feliz") {
      s += `<ellipse cx="${hx + 3}" cy="${n(by + r * 2)}" rx="${n(r * 0.7)}" ry="${n(r * 1)}" fill="#ff6f8a"/>`;
    }

    // Mejillas
    if (animo === "feliz" || animo === "normal") {
      s += `<circle cx="${n(hx - sep * 1.85)}" cy="${by - 3}" r="${n(sep * 0.3)}" fill="#ff9aa2" opacity=".55"/>
            <circle cx="${n(hx + sep * 1.85)}" cy="${by - 3}" r="${n(sep * 0.3)}" fill="#ff9aa2" opacity=".55"/>`;
    }
    return s;
  }

  /* ---------- Detalles de cada especie ----------
     orejas: se dibujan antes de la cabeza. cola y detras: antes del cuerpo.
     cara: después de la cabeza y antes de los ojos (hocicos, manchas). */
  const DETALLES = {
    gato: {
      orejas(a, p) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        const oreja = (d) => `<path d="M ${n(hx + d * r * 0.8)} ${n(hy - r * 0.45)} L ${n(hx + d * r * 0.95)} ${n(hy - r * 1.2)} L ${n(hx + d * r * 0.35)} ${n(hy - r * 0.85)} Z" fill="${p.piel}"/>
          <path d="M ${n(hx + d * r * 0.76)} ${n(hy - r * 0.55)} L ${n(hx + d * r * 0.86)} ${n(hy - r * 1.02)} L ${n(hx + d * r * 0.47)} ${n(hy - r * 0.8)} Z" fill="${p.detalle}"/>`;
        return oreja(-1) + oreja(1);
      },
      cola(a, p) {
        const c = a.cuerpo;
        return `<path d="M ${n(c.cx + c.rx * 0.85)} ${n(c.cy + c.ry * 0.35)} q ${n(c.rx * 0.8)} ${n(c.ry * 0.15)} ${n(c.rx * 0.7)} ${n(-c.ry)} q ${n(-c.rx * 0.17)} ${n(c.ry * 0.57)} ${n(-c.rx * 0.6)} ${n(c.ry * 0.7)} z" fill="${p.piel}"/>`;
      },
      cara(a, p, etapa) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        const y1 = hy + r * 0.15, y2 = hy + r * 0.28;
        let s = `<g stroke="${p.oscuro}" stroke-width="2" stroke-linecap="round" opacity=".8">
          <line x1="${n(hx - r * 0.35)}" y1="${n(y1)}" x2="${n(hx - r * 0.98)}" y2="${n(y1 - 4)}"/>
          <line x1="${n(hx - r * 0.35)}" y1="${n(y2)}" x2="${n(hx - r * 0.98)}" y2="${n(y2 + 4)}"/>
          <line x1="${n(hx + r * 0.35)}" y1="${n(y1)}" x2="${n(hx + r * 0.98)}" y2="${n(y1 - 4)}"/>
          <line x1="${n(hx + r * 0.35)}" y1="${n(y2)}" x2="${n(hx + r * 0.98)}" y2="${n(y2 + 4)}"/></g>`;
        if (etapa === 3) s += `<path d="M ${hx - 6} ${n(hy - r * 0.95)} l 3 ${n(r * 0.3)} M ${hx} ${n(hy - r)} l 0 ${n(r * 0.32)} M ${hx + 6} ${n(hy - r * 0.95)} l -3 ${n(r * 0.3)}" stroke="${p.oscuro}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>`;
        return s;
      },
    },
    perro: {
      orejas(a, p) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        const oreja = (d) => `<ellipse cx="${n(hx + d * r * 0.88)}" cy="${n(hy + r * 0.05)}" rx="${n(r * 0.3)}" ry="${n(r * 0.62)}" fill="${p.oscuro}" transform="rotate(${d * 14} ${n(hx + d * r * 0.88)} ${n(hy + r * 0.05)})"/>`;
        return oreja(-1) + oreja(1);
      },
      cola(a, p) {
        const c = a.cuerpo;
        const x = c.cx + c.rx * 0.92, y = c.cy - c.ry * 0.35;
        return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(c.rx * 0.14)}" ry="${n(c.ry * 0.38)}" fill="${p.piel}" transform="rotate(35 ${n(x)} ${n(y)})"/>`;
      },
      cara(a, p, etapa) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        let s = `<ellipse cx="${hx}" cy="${n(hy + r * 0.4)}" rx="${n(r * 0.42)}" ry="${n(r * 0.3)}" fill="${p.panza}"/>`;
        if (etapa >= 2) s += `<ellipse cx="${n(hx + a.ojos.sep)}" cy="${n(a.ojos.y - 1)}" rx="${n(a.ojos.r * 2)}" ry="${n(a.ojos.r * 2.3)}" fill="${p.oscuro}" opacity=".5"/>`;
        return s;
      },
    },
    conejo: {
      orejas(a, p) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        const oreja = (d) => {
          const x = hx + d * r * 0.45, y = hy - r * 1.12;
          return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r * 0.22)}" ry="${n(r * 0.66)}" fill="${p.piel}" ${borde(p)} transform="rotate(${d * 12} ${n(x)} ${n(y)})"/>
            <ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r * 0.11)}" ry="${n(r * 0.5)}" fill="${p.detalle}" transform="rotate(${d * 12} ${n(x)} ${n(y)})"/>`;
        };
        return oreja(-1) + oreja(1);
      },
      cola(a, p) {
        const c = a.cuerpo;
        return `<circle cx="${n(c.cx + c.rx * 0.92)}" cy="${n(c.cy + c.ry * 0.3)}" r="${n(c.rx * 0.22)}" fill="#fff" ${borde(p)}/>`;
      },
      cara() { return ""; },
    },
    panda: {
      orejas(a, p) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        return `<circle cx="${n(hx - r * 0.72)}" cy="${n(hy - r * 0.72)}" r="${n(r * 0.32)}" fill="#2b2b2b"/>
                <circle cx="${n(hx + r * 0.72)}" cy="${n(hy - r * 0.72)}" r="${n(r * 0.32)}" fill="#2b2b2b"/>`;
      },
      cola(a) {
        const c = a.cuerpo;
        return `<circle cx="${n(c.cx + c.rx * 0.9)}" cy="${n(c.cy + c.ry * 0.3)}" r="${n(c.rx * 0.16)}" fill="#2b2b2b"/>`;
      },
      // Brazos y patas negros: se dibujan encima del cuerpo
      cuerpoExtra(a) {
        const c = a.cuerpo;
        const bx = c.cx - c.rx * 0.8, by = c.cy + c.ry * 0.05, bx2 = c.cx + c.rx * 0.8;
        return `<ellipse cx="${n(bx)}" cy="${n(by)}" rx="${n(c.rx * 0.26)}" ry="${n(c.ry * 0.42)}" fill="#2b2b2b" transform="rotate(24 ${n(bx)} ${n(by)})"/>
                <ellipse cx="${n(bx2)}" cy="${n(by)}" rx="${n(c.rx * 0.26)}" ry="${n(c.ry * 0.42)}" fill="#2b2b2b" transform="rotate(-24 ${n(bx2)} ${n(by)})"/>`;
      },
      cara() { return ""; },
    },
    zorro: {
      orejas(a, p) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        const oreja = (d) => `<path d="M ${n(hx + d * r * 0.85)} ${n(hy - r * 0.35)} L ${n(hx + d * r * 1.02)} ${n(hy - r * 1.3)} L ${n(hx + d * r * 0.25)} ${n(hy - r * 0.88)} Z" fill="${p.piel}"/>
          <path d="M ${n(hx + d * r * 0.8)} ${n(hy - r * 0.45)} L ${n(hx + d * r * 0.92)} ${n(hy - r * 1.1)} L ${n(hx + d * r * 0.4)} ${n(hy - r * 0.82)} Z" fill="${p.oscuro}"/>`;
        return oreja(-1) + oreja(1);
      },
      cola(a, p) {
        const c = a.cuerpo;
        const x = c.cx + c.rx * 1.0, y = c.cy + c.ry * 0.15;
        return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(c.rx * 0.3)}" ry="${n(c.ry * 0.68)}" fill="${p.piel}" transform="rotate(38 ${n(x)} ${n(y)})"/>
                <circle cx="${n(x + c.rx * 0.38)}" cy="${n(y - c.ry * 0.5)}" r="${n(c.rx * 0.2)}" fill="#fff"/>`;
      },
      cara(a, p) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        return `<ellipse cx="${hx}" cy="${n(hy + r * 0.45)}" rx="${n(r * 0.58)}" ry="${n(r * 0.36)}" fill="#fff"/>
                <ellipse cx="${n(hx - r * 0.62)}" cy="${n(hy + r * 0.2)}" rx="${n(r * 0.3)}" ry="${n(r * 0.42)}" fill="#fff" opacity=".9"/>
                <ellipse cx="${n(hx + r * 0.62)}" cy="${n(hy + r * 0.2)}" rx="${n(r * 0.3)}" ry="${n(r * 0.42)}" fill="#fff" opacity=".9"/>`;
      },
    },
    dragon: {
      orejas(a, p, etapa) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        const alto = etapa === 3 ? 0.55 : 0.4;
        const cuerno = (d) => `<path d="M ${n(hx + d * r * 0.35)} ${n(hy - r * 0.85)} Q ${n(hx + d * r * 0.7)} ${n(hy - r * (0.9 + alto))} ${n(hx + d * r * 0.85)} ${n(hy - r * (0.85 + alto))} Q ${n(hx + d * r * 0.65)} ${n(hy - r * 0.95)} ${n(hx + d * r * 0.62)} ${n(hy - r * 0.7)} Z" fill="${p.detalle}"/>`;
        return cuerno(-1) + cuerno(1);
      },
      detras(a, p, etapa) {
        if (etapa < 2) return "";
        const c = a.cuerpo;
        const t = etapa === 3 ? 1 : 0.7;
        const ala = (d) => `<path d="M ${n(c.cx + d * c.rx * 0.5)} ${n(c.cy - c.ry * 0.3)} Q ${n(c.cx + d * c.rx * 1.5 * t)} ${n(c.cy - c.ry * 1.4 * t)} ${n(c.cx + d * c.rx * 1.7 * t)} ${n(c.cy - c.ry * 0.5)} Q ${n(c.cx + d * c.rx * 1.3 * t)} ${n(c.cy - c.ry * 0.6)} ${n(c.cx + d * c.rx * 1.2 * t)} ${n(c.cy - c.ry * 0.05)} Q ${n(c.cx + d * c.rx * 0.9)} ${n(c.cy - c.ry * 0.3)} ${n(c.cx + d * c.rx * 0.5)} ${n(c.cy + c.ry * 0.1)} Z" fill="${p.oscuro}"/>`;
        return ala(-1) + ala(1);
      },
      cola(a, p) {
        const c = a.cuerpo;
        const x = c.cx + c.rx * 0.8, y = c.cy + c.ry * 0.5;
        return `<path d="M ${n(x)} ${n(y)} q ${n(c.rx * 0.9)} ${n(c.ry * 0.3)} ${n(c.rx * 0.95)} ${n(-c.ry * 0.5)} q ${n(-c.rx * 0.3)} ${n(c.ry * 0.5)} ${n(-c.rx * 0.7)} ${n(c.ry * 0.25)} z" fill="${p.piel}"/>
                <path d="M ${n(x + c.rx * 0.95)} ${n(y - c.ry * 0.5)} l 8 -9 l 4 11 z" fill="${p.detalle}"/>`;
      },
      cara(a, p) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        return `<ellipse cx="${hx}" cy="${n(hy + r * 0.42)}" rx="${n(r * 0.42)}" ry="${n(r * 0.28)}" fill="${p.panza}"/>`;
      },
      cuerpoExtra(a, p) {
        const c = a.cuerpo;
        // Picos en la espalda
        let s = "";
        for (let i = -1; i <= 1; i++) {
          const x = c.cx + i * c.rx * 0.28, y = c.cy - c.ry * 0.98;
          s += `<path d="M ${n(x - 6)} ${n(y + 4)} l 6 -9 l 6 9 z" fill="${p.detalle}"/>`;
        }
        return s;
      },
    },
  };

  /* ---------- Ropa ----------
     Cada prenda tiene funciones por capa:
     detras (antes del cuerpo), cuerpo (sobre el cuerpo), cara (sobre la cara), cabeza (al final). */
  const DIBUJO_ROPA = {
    "gorro-lana": {
      cabeza(a) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        return `<path d="M ${n(hx - r * 0.98)} ${n(hy - r * 0.42)} Q ${hx} ${n(hy - r * 2.3)} ${n(hx + r * 0.98)} ${n(hy - r * 0.42)} Z" fill="#e74c6f"/>
          <path d="M ${n(hx - r * 0.6)} ${n(hy - r * 0.95)} Q ${hx} ${n(hy - r * 1.6)} ${n(hx + r * 0.6)} ${n(hy - r * 0.95)}" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>
          <rect x="${n(hx - r * 1.02)}" y="${n(hy - r * 0.62)}" width="${n(r * 2.04)}" height="${n(r * 0.28)}" rx="${n(r * 0.12)}" fill="#fff"/>
          <circle cx="${hx}" cy="${n(hy - r * 1.4)}" r="${n(r * 0.2)}" fill="#fff"/>`;
      },
    },
    "gorra": {
      cabeza(a) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        return `<path d="M ${n(hx - r * 0.95)} ${n(hy - r * 0.45)} Q ${hx} ${n(hy - r * 2.1)} ${n(hx + r * 0.95)} ${n(hy - r * 0.45)} Z" fill="#3b82f6"/>
          <path d="M ${hx} ${n(hy - r * 1.27)} L ${hx} ${n(hy - r * 0.45)}" stroke="#2563eb" stroke-width="2"/>
          <ellipse cx="${n(hx + r * 0.75)}" cy="${n(hy - r * 0.45)}" rx="${n(r * 0.7)}" ry="${n(r * 0.14)}" fill="#2563eb"/>
          <circle cx="${hx}" cy="${n(hy - r * 1.27)}" r="3" fill="#2563eb"/>`;
      },
    },
    "paja": {
      cabeza(a) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        return `<ellipse cx="${hx}" cy="${n(hy - r * 0.7)}" rx="${n(r * 1.35)}" ry="${n(r * 0.24)}" fill="#f0cf7a" stroke="#d9b45a" stroke-width="1.5"/>
          <path d="M ${n(hx - r * 0.72)} ${n(hy - r * 0.7)} Q ${n(hx - r * 0.72)} ${n(hy - r * 1.5)} ${hx} ${n(hy - r * 1.5)} Q ${n(hx + r * 0.72)} ${n(hy - r * 1.5)} ${n(hx + r * 0.72)} ${n(hy - r * 0.7)} Z" fill="#f5d98e" stroke="#d9b45a" stroke-width="1.5"/>
          <rect x="${n(hx - r * 0.74)}" y="${n(hy - r * 1.02)}" width="${n(r * 1.48)}" height="${n(r * 0.2)}" fill="#e74c6f"/>`;
      },
    },
    "fiesta": {
      cabeza(a) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        return `<path d="M ${n(hx - r * 0.45)} ${n(hy - r * 0.8)} L ${hx} ${n(hy - r * 1.75)} L ${n(hx + r * 0.45)} ${n(hy - r * 0.8)} Z" fill="#ff7b8a"/>
          <circle cx="${n(hx - 4)}" cy="${n(hy - r * 1.05)}" r="3" fill="#ffd93d"/><circle cx="${n(hx + 6)}" cy="${n(hy - r * 1.3)}" r="2.5" fill="#5ec8ff"/><circle cx="${n(hx - 2)}" cy="${n(hy - r * 1.5)}" r="2" fill="#6fcf97"/>
          <circle cx="${hx}" cy="${n(hy - r * 1.75)}" r="5" fill="#ffd93d"/>`;
      },
    },
    "flor": {
      cabeza(a) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        const fx = hx + r * 0.62, fy = hy - r * 0.85, pr = r * 0.15;
        let s = "";
        for (let i = 0; i < 5; i++) {
          const ang = (i / 5) * Math.PI * 2;
          s += `<circle cx="${n(fx + Math.cos(ang) * pr * 1.3)}" cy="${n(fy + Math.sin(ang) * pr * 1.3)}" r="${n(pr)}" fill="#ff8fb1"/>`;
        }
        return s + `<circle cx="${n(fx)}" cy="${n(fy)}" r="${n(pr * 0.8)}" fill="#ffd93d"/>`;
      },
    },
    "corona": {
      cabeza(a) {
        const { cx: hx, cy: hy, r } = a.cabeza;
        return `<path d="M ${n(hx - r * 0.65)} ${n(hy - r * 0.75)} L ${n(hx - r * 0.65)} ${n(hy - r * 1.35)} L ${n(hx - r * 0.32)} ${n(hy - r * 1.05)} L ${hx} ${n(hy - r * 1.5)} L ${n(hx + r * 0.32)} ${n(hy - r * 1.05)} L ${n(hx + r * 0.65)} ${n(hy - r * 1.35)} L ${n(hx + r * 0.65)} ${n(hy - r * 0.75)} Z" fill="#ffd35a" stroke="#e0a800" stroke-width="1.5"/>
          <circle cx="${n(hx - r * 0.35)}" cy="${n(hy - r * 0.9)}" r="3" fill="#ff5c7a"/><circle cx="${hx}" cy="${n(hy - r * 0.92)}" r="3" fill="#5ec8ff"/><circle cx="${n(hx + r * 0.35)}" cy="${n(hy - r * 0.9)}" r="3" fill="#6fcf97"/>`;
      },
    },
    "lentes-sol": {
      cara(a) {
        const { y, sep, r } = a.ojos; const hx = a.cabeza.cx;
        const lente = (x) => `<rect x="${n(x - r * 1.6)}" y="${n(y - r * 1.2)}" width="${n(r * 3.2)}" height="${n(r * 2.4)}" rx="${n(r * 0.8)}" fill="#1f2937"/>
          <rect x="${n(x - r * 1.1)}" y="${n(y - r * 0.9)}" width="${n(r * 0.8)}" height="${n(r * 0.5)}" rx="2" fill="#fff" opacity=".35"/>`;
        return lente(hx - sep) + lente(hx + sep) + `<rect x="${n(hx - sep + r * 1.5)}" y="${n(y - 1.5)}" width="${n(sep * 2 - r * 3)}" height="3" fill="#1f2937"/>`;
      },
    },
    "lentes": {
      cara(a) {
        const { y, sep, r } = a.ojos; const hx = a.cabeza.cx;
        const lente = (x) => `<circle cx="${x}" cy="${y}" r="${n(r * 1.75)}" fill="#fff" fill-opacity=".2" stroke="#2b3a4a" stroke-width="2.5"/>`;
        return lente(hx - sep) + lente(hx + sep) + `<path d="M ${n(hx - sep + r * 1.75)} ${y} L ${n(hx + sep - r * 1.75)} ${y}" stroke="#2b3a4a" stroke-width="2.5"/>`;
      },
    },
    "antifaz": {
      cara(a) {
        const { y, sep, r } = a.ojos; const hx = a.cabeza.cx;
        return `<path fill-rule="evenodd" fill="#5b2bd9" d="M ${n(hx - sep - r * 2.4)} ${n(y - r * 0.3)} Q ${n(hx - sep - r * 1.5)} ${n(y - r * 2.4)} ${hx} ${n(y - r * 1.5)} Q ${n(hx + sep + r * 1.5)} ${n(y - r * 2.4)} ${n(hx + sep + r * 2.4)} ${n(y - r * 0.3)} Q ${n(hx + sep + r * 1.2)} ${n(y + r * 1.9)} ${hx} ${n(y + r * 1.2)} Q ${n(hx - sep - r * 1.2)} ${n(y + r * 1.9)} ${n(hx - sep - r * 2.4)} ${n(y - r * 0.3)} Z
          M ${n(hx - sep)} ${n(y - r * 1.3)} a ${n(r * 1.3)} ${n(r * 1.3)} 0 1 0 0.1 0 Z
          M ${n(hx + sep)} ${n(y - r * 1.3)} a ${n(r * 1.3)} ${n(r * 1.3)} 0 1 0 0.1 0 Z"/>`;
      },
    },
    "bufanda": {
      cara(a) {
        const { cx: hx, cy: hy, r } = a.cabeza; const ny = hy + r * 0.88;
        return `<rect x="${n(hx - r * 0.9)}" y="${n(ny - r * 0.14)}" width="${n(r * 1.8)}" height="${n(r * 0.32)}" rx="${n(r * 0.16)}" fill="#e74c6f"/>
          <rect x="${n(hx + r * 0.3)}" y="${n(ny + r * 0.05)}" width="${n(r * 0.3)}" height="${n(r * 0.8)}" rx="4" fill="#e74c6f"/>
          <path d="M ${n(hx - r * 0.6)} ${n(ny - r * 0.08)} l 0 ${n(r * 0.2)} M ${n(hx - r * 0.3)} ${n(ny - r * 0.08)} l 0 ${n(r * 0.2)} M ${hx} ${n(ny - r * 0.08)} l 0 ${n(r * 0.2)} M ${n(hx + r * 0.45)} ${n(ny + r * 0.3)} l ${n(r * 0.3)} 0 M ${n(hx + r * 0.45)} ${n(ny + r * 0.55)} l ${n(r * 0.3)} 0" stroke="#fff" stroke-width="2.5" opacity=".7"/>`;
      },
    },
    "panuelo": {
      cara(a) {
        const { cx: hx, cy: hy, r } = a.cabeza; const ny = hy + r * 0.85;
        return `<rect x="${n(hx - r * 0.85)}" y="${n(ny - r * 0.1)}" width="${n(r * 1.7)}" height="${n(r * 0.2)}" rx="4" fill="#2563eb"/>
          <path d="M ${n(hx - r * 0.7)} ${n(ny + r * 0.05)} L ${n(hx + r * 0.7)} ${n(ny + r * 0.05)} L ${hx} ${n(ny + r * 0.75)} Z" fill="#3b82f6"/>
          <circle cx="${hx}" cy="${n(ny + r * 0.3)}" r="2" fill="#fff" opacity=".7"/><circle cx="${n(hx - 10)}" cy="${n(ny + r * 0.15)}" r="2" fill="#fff" opacity=".7"/><circle cx="${n(hx + 10)}" cy="${n(ny + r * 0.15)}" r="2" fill="#fff" opacity=".7"/>`;
      },
    },
    "corbatin": {
      cara(a) {
        const { cx: hx, cy: hy, r } = a.cabeza; const ny = hy + r * 0.95;
        const w = r * 0.42, h = r * 0.28;
        return `<path d="M ${hx} ${ny} L ${n(hx - w)} ${n(ny - h)} L ${n(hx - w)} ${n(ny + h)} Z M ${hx} ${ny} L ${n(hx + w)} ${n(ny - h)} L ${n(hx + w)} ${n(ny + h)} Z" fill="#e63946"/>
          <circle cx="${hx}" cy="${ny}" r="${n(h * 0.45)}" fill="#b8202e"/>`;
      },
    },
    "collar-flores": {
      cara(a) {
        const { cx: hx, cy: hy, r } = a.cabeza; const ny = hy + r * 0.92;
        const colores = ["#ff8fb1", "#ffd93d", "#ff7b8a", "#b58cff", "#ff8fb1", "#ffd93d", "#ff7b8a"];
        let s = "";
        for (let i = 0; i < 7; i++) {
          const t = (i - 3) / 3;
          s += `<circle cx="${n(hx + t * r * 0.85)}" cy="${n(ny + (1 - t * t) * r * 0.25)}" r="${n(r * 0.13)}" fill="${colores[i]}"/>`;
        }
        return s;
      },
    },
    "polera": {
      cuerpo(a) {
        const c = a.cuerpo;
        return `<path d="M ${n(c.cx - c.rx * 0.92)} ${n(c.cy - c.ry * 0.35)} Q ${n(c.cx - c.rx)} ${n(c.cy + c.ry * 0.35)} ${n(c.cx - c.rx * 0.7)} ${n(c.cy + c.ry * 0.42)} L ${n(c.cx + c.rx * 0.7)} ${n(c.cy + c.ry * 0.42)} Q ${n(c.cx + c.rx)} ${n(c.cy + c.ry * 0.35)} ${n(c.cx + c.rx * 0.92)} ${n(c.cy - c.ry * 0.35)} Q ${c.cx} ${n(c.cy - c.ry * 0.05)} ${n(c.cx - c.rx * 0.92)} ${n(c.cy - c.ry * 0.35)} Z" fill="#ff6b6b"/>
          <path d="M ${c.cx} ${n(c.cy - c.ry * 0.05)} l 3 6 l 6 1 l -4.5 4 l 1 6 l -5.5 -3 l -5.5 3 l 1 -6 l -4.5 -4 l 6 -1 z" fill="#ffd93d"/>`;
      },
    },
    "chaleco": {
      cuerpo(a) {
        const c = a.cuerpo;
        return `<path d="M ${n(c.cx - c.rx * 0.92)} ${n(c.cy - c.ry * 0.35)} Q ${n(c.cx - c.rx * 1.02)} ${n(c.cy + c.ry * 0.6)} ${n(c.cx - c.rx * 0.6)} ${n(c.cy + c.ry * 0.7)} L ${n(c.cx + c.rx * 0.6)} ${n(c.cy + c.ry * 0.7)} Q ${n(c.cx + c.rx * 1.02)} ${n(c.cy + c.ry * 0.6)} ${n(c.cx + c.rx * 0.92)} ${n(c.cy - c.ry * 0.35)} Q ${c.cx} ${n(c.cy - c.ry * 0.05)} ${n(c.cx - c.rx * 0.92)} ${n(c.cy - c.ry * 0.35)} Z" fill="#6c9a4a"/>
          <path d="M ${n(c.cx - c.rx * 0.5)} ${n(c.cy + c.ry * 0.1)} l ${n(c.rx)} 0 M ${n(c.cx - c.rx * 0.55)} ${n(c.cy + c.ry * 0.35)} l ${n(c.rx * 1.1)} 0" stroke="#5a8340" stroke-width="2" opacity=".7"/>
          <circle cx="${c.cx}" cy="${n(c.cy + c.ry * 0.05)}" r="2.5" fill="#f5d98e"/><circle cx="${c.cx}" cy="${n(c.cy + c.ry * 0.3)}" r="2.5" fill="#f5d98e"/><circle cx="${c.cx}" cy="${n(c.cy + c.ry * 0.55)}" r="2.5" fill="#f5d98e"/>`;
      },
    },
    "impermeable": {
      cuerpo(a) {
        const c = a.cuerpo;
        return `<path d="M ${n(c.cx - c.rx * 0.92)} ${n(c.cy - c.ry * 0.35)} Q ${n(c.cx - c.rx * 1.02)} ${n(c.cy + c.ry * 0.6)} ${n(c.cx - c.rx * 0.6)} ${n(c.cy + c.ry * 0.7)} L ${n(c.cx + c.rx * 0.6)} ${n(c.cy + c.ry * 0.7)} Q ${n(c.cx + c.rx * 1.02)} ${n(c.cy + c.ry * 0.6)} ${n(c.cx + c.rx * 0.92)} ${n(c.cy - c.ry * 0.35)} Q ${c.cx} ${n(c.cy - c.ry * 0.05)} ${n(c.cx - c.rx * 0.92)} ${n(c.cy - c.ry * 0.35)} Z" fill="#ffd93d"/>
          <path d="M ${c.cx} ${n(c.cy - c.ry * 0.1)} L ${c.cx} ${n(c.cy + c.ry * 0.7)}" stroke="#e0b800" stroke-width="2.5"/>
          <circle cx="${n(c.cx - 7)}" cy="${n(c.cy + c.ry * 0.15)}" r="2.2" fill="#e0b800"/><circle cx="${n(c.cx - 7)}" cy="${n(c.cy + c.ry * 0.45)}" r="2.2" fill="#e0b800"/>`;
      },
    },
    "vestido": {
      cuerpo(a) {
        const c = a.cuerpo;
        return `<path d="M ${n(c.cx - c.rx * 0.7)} ${n(c.cy - c.ry * 0.3)} L ${n(c.cx - c.rx * 1.15)} ${n(c.cy + c.ry * 0.85)} L ${n(c.cx + c.rx * 1.15)} ${n(c.cy + c.ry * 0.85)} L ${n(c.cx + c.rx * 0.7)} ${n(c.cy - c.ry * 0.3)} Q ${c.cx} ${n(c.cy - c.ry * 0.05)} ${n(c.cx - c.rx * 0.7)} ${n(c.cy - c.ry * 0.3)} Z" fill="#ff8fb1"/>
          <circle cx="${n(c.cx - c.rx * 0.4)}" cy="${n(c.cy + c.ry * 0.4)}" r="3" fill="#fff" opacity=".8"/><circle cx="${n(c.cx + c.rx * 0.3)}" cy="${n(c.cy + c.ry * 0.2)}" r="3" fill="#fff" opacity=".8"/><circle cx="${n(c.cx + c.rx * 0.5)}" cy="${n(c.cy + c.ry * 0.6)}" r="3" fill="#fff" opacity=".8"/><circle cx="${n(c.cx - c.rx * 0.1)}" cy="${n(c.cy + c.ry * 0.65)}" r="3" fill="#fff" opacity=".8"/>
          <path d="M ${n(c.cx - c.rx * 0.8)} ${n(c.cy - c.ry * 0.05)} Q ${c.cx} ${n(c.cy + c.ry * 0.15)} ${n(c.cx + c.rx * 0.8)} ${n(c.cy - c.ry * 0.05)}" stroke="#fff" stroke-width="2.5" fill="none" opacity=".8"/>`;
      },
    },
    "capa": {
      detras(a) {
        const c = a.cuerpo;
        return `<path d="M ${n(c.cx - c.rx * 0.75)} ${n(c.cy - c.ry * 0.7)} L ${n(c.cx - c.rx * 1.3)} ${n(c.cy + c.ry * 0.95)} L ${n(c.cx + c.rx * 1.3)} ${n(c.cy + c.ry * 0.95)} L ${n(c.cx + c.rx * 0.75)} ${n(c.cy - c.ry * 0.7)} Z" fill="#e63946"/>`;
      },
      cara(a) {
        const { cx: hx, cy: hy, r } = a.cabeza; const ny = hy + r * 0.92;
        return `<path d="M ${n(hx - r * 0.5)} ${ny} Q ${hx} ${n(ny + r * 0.25)} ${n(hx + r * 0.5)} ${ny}" stroke="#e63946" stroke-width="4" fill="none" stroke-linecap="round"/>
          <circle cx="${hx}" cy="${n(ny + r * 0.1)}" r="3.5" fill="#ffd35a"/>`;
      },
    },
  };

  /* ---------- Dibujo completo ---------- */
  function dibujar({ especie, etapa = 1, animo = "normal", ropa = {}, toques = 0 }) {
    const sp = ESPECIES[especie] || ESPECIES.gato;
    const p = sp.paleta;
    let contenido = "";

    if (etapa === 0) {
      contenido = huevo(p, toques);
    } else {
      const a = ANCLAS[etapa === 1 ? "bebe" : etapa === 2 ? "joven" : "adulto"];
      const det = DETALLES[especie] || DETALLES.gato;
      const prendas = Object.values(ropa || {}).filter(Boolean).map((id) => DIBUJO_ROPA[id]).filter(Boolean);
      const capa = (nombre) => prendas.map((pr) => pr[nombre] ? pr[nombre](a, p) : "").join("");

      contenido =
        capa("detras") +
        (det.detras ? det.detras(a, p, etapa) : "") +
        det.cola(a, p, etapa) +
        cuerpo(a, p) +
        (det.cuerpoExtra ? det.cuerpoExtra(a, p, etapa) : "") +
        capa("cuerpo") +
        patas(a, p) +
        det.orejas(a, p, etapa) +
        cabeza(a, p) +
        det.cara(a, p, etapa) +
        cara(a, p, animo, especie) +
        capa("cara") +
        capa("cabeza");
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">${contenido}</svg>`;
  }

  return { dibujar };
})();
