/* ===== Mi Mascota — minijuegos =====
   Cada juego tiene iniciar(contenedor, dificultad, alTerminar), detener() y resumen().
   dificultad: 0 fácil, 1 normal, 2 difícil.
   alTerminar (y resumen) entregan { puntos (0 a 100), exito (true/false), texto, ...detalles }
   para que app.js calcule el premio. */

// Sonidos definidos en app.js; si no existen, no pasa nada.
function son(nombre) {
  if (typeof Sonido !== "undefined" && Sonido[nombre]) Sonido[nombre]();
}

// Cartel de fin de juego que aparece encima del tablero
function cartelFin(cont, titulo, detalle, alListo) {
  const aviso = document.createElement("div");
  aviso.className = "juego-fin";
  aviso.innerHTML = `<strong>${titulo}</strong><span>${detalle}</span><button>Listo</button>`;
  aviso.querySelector("button").addEventListener("click", alListo);
  cont.appendChild(aviso);
}

/* ---------- BLOQUES (tipo Tetris) ---------- */
const Bloques = (() => {
  const COLS = 10, FILAS = 16;
  const PIEZAS = [
    { forma: [[1, 1, 1, 1]],           color: "#5ec8ff" },
    { forma: [[1, 1], [1, 1]],         color: "#ffd93d" },
    { forma: [[0, 1, 0], [1, 1, 1]],   color: "#b58cff" },
    { forma: [[1, 0, 0], [1, 1, 1]],   color: "#ffb347" },
    { forma: [[0, 0, 1], [1, 1, 1]],   color: "#5aa9ff" },
    { forma: [[1, 1, 0], [0, 1, 1]],   color: "#ff7b8a" },
    { forma: [[0, 1, 1], [1, 1, 0]],   color: "#6fcf97" },
  ];
  const VELOCIDAD_BASE = [850, 620, 420];
  const META = [2, 4, 6];

  let cont, canvas, ctx, infoEl, celda, dif;
  let tablero, pieza, px, py, lineas, timer, terminado, alTerminar;

  function iniciar(contenedor, dificultad, cb) {
    cont = contenedor;
    dif = dificultad;
    alTerminar = cb;
    terminado = false;
    lineas = 0;
    tablero = Array.from({ length: FILAS }, () => Array(COLS).fill(null));

    cont.innerHTML = `
      <p class="juego-ayuda">Completa filas para borrarlas. Meta: ${META[dif]} filas.</p>
      <div class="bloques-info">🧱 Filas: <strong id="bloquesLineas">0</strong></div>
      <canvas id="bloquesCanvas" class="bloques-canvas"></canvas>
      <div class="bloques-controles">
        <button data-accion="izq" aria-label="Izquierda">◀</button>
        <button data-accion="rotar" aria-label="Girar">🔄</button>
        <button data-accion="der" aria-label="Derecha">▶</button>
        <button data-accion="caer" aria-label="Bajar">⬇</button>
      </div>`;

    canvas = cont.querySelector("#bloquesCanvas");
    ctx = canvas.getContext("2d");
    infoEl = cont.querySelector("#bloquesLineas");

    const anchoMax = Math.min(cont.clientWidth, 320);
    const altoMax = window.innerHeight - 300;
    celda = Math.max(14, Math.min(Math.floor(anchoMax / COLS), Math.floor(altoMax / FILAS)));
    canvas.width = COLS * celda;
    canvas.height = FILAS * celda;

    cont.querySelectorAll(".bloques-controles button").forEach((b) => {
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); accion(b.dataset.accion); });
    });
    document.addEventListener("keydown", teclado);

    nuevaPieza();
    dibujar();
    programar();
  }

  function detener() {
    clearInterval(timer);
    document.removeEventListener("keydown", teclado);
    terminado = true;
  }

  function velocidad() { return Math.max(200, VELOCIDAD_BASE[dif] - lineas * 40); }
  function programar() { clearInterval(timer); timer = setInterval(bajar, velocidad()); }

  function teclado(e) {
    const mapa = { ArrowLeft: "izq", ArrowRight: "der", ArrowUp: "rotar", ArrowDown: "caer", " ": "caer" };
    if (mapa[e.key]) { e.preventDefault(); accion(mapa[e.key]); }
  }

  function nuevaPieza() {
    const p = PIEZAS[Math.floor(Math.random() * PIEZAS.length)];
    pieza = { forma: p.forma.map((f) => f.slice()), color: p.color };
    px = Math.floor((COLS - pieza.forma[0].length) / 2);
    py = 0;
    if (choca(pieza.forma, px, py)) finDelJuego();
  }

  function choca(forma, x, y) {
    for (let f = 0; f < forma.length; f++) {
      for (let c = 0; c < forma[f].length; c++) {
        if (!forma[f][c]) continue;
        const tx = x + c, ty = y + f;
        if (tx < 0 || tx >= COLS || ty >= FILAS) return true;
        if (ty >= 0 && tablero[ty][tx]) return true;
      }
    }
    return false;
  }

  function accion(nombre) {
    if (terminado) return;
    if (nombre === "izq" && !choca(pieza.forma, px - 1, py)) px--;
    if (nombre === "der" && !choca(pieza.forma, px + 1, py)) px++;
    if (nombre === "rotar") {
      const girada = pieza.forma[0].map((_, c) => pieza.forma.map((fila) => fila[c]).reverse());
      for (const dx of [0, -1, 1, -2, 2]) {
        if (!choca(girada, px + dx, py)) { pieza.forma = girada; px += dx; break; }
      }
    }
    if (nombre === "caer") {
      while (!choca(pieza.forma, px, py + 1)) py++;
      fijar();
    }
    dibujar();
  }

  function bajar() {
    if (terminado) return;
    if (!choca(pieza.forma, px, py + 1)) py++;
    else fijar();
    dibujar();
  }

  function fijar() {
    pieza.forma.forEach((fila, f) => fila.forEach((v, c) => {
      if (v && py + f >= 0) tablero[py + f][px + c] = pieza.color;
    }));
    let borradas = 0;
    for (let f = FILAS - 1; f >= 0; f--) {
      if (tablero[f].every(Boolean)) {
        tablero.splice(f, 1);
        tablero.unshift(Array(COLS).fill(null));
        borradas++;
        f++;
      }
    }
    if (borradas) {
      lineas += borradas;
      infoEl.textContent = lineas;
      son("atrapar");
      programar();
    } else {
      son("toque");
    }
    nuevaPieza();
  }

  function dibujar() {
    ctx.fillStyle = "#f3f5f7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#e3e8ee";
    for (let c = 1; c < COLS; c++) { ctx.beginPath(); ctx.moveTo(c * celda, 0); ctx.lineTo(c * celda, canvas.height); ctx.stroke(); }
    for (let f = 1; f < FILAS; f++) { ctx.beginPath(); ctx.moveTo(0, f * celda); ctx.lineTo(canvas.width, f * celda); ctx.stroke(); }
    tablero.forEach((fila, f) => fila.forEach((color, c) => { if (color) bloque(c, f, color); }));
    if (!terminado) pieza.forma.forEach((fila, f) => fila.forEach((v, c) => { if (v) bloque(px + c, py + f, pieza.color); }));
  }

  function bloque(c, f, color) {
    const x = c * celda + 1, y = f * celda + 1, t = celda - 2, r = Math.max(2, celda / 5);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + t, y, x + t, y + t, r);
    ctx.arcTo(x + t, y + t, x, y + t, r);
    ctx.arcTo(x, y + t, x, y, r);
    ctx.arcTo(x, y, x + t, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.fillRect(x + 2, y + 2, t - 4, Math.max(2, t / 4));
  }

  function finDelJuego() {
    detener();
    dibujar();
    son(lineas >= META[dif] ? "ganar" : "no");
    cartelFin(cont, lineas >= META[dif] ? "🎉 ¡Meta cumplida!" : "¡Se llenó!", `Borraste ${lineas} fila${lineas === 1 ? "" : "s"}`, () => alTerminar(resumen()));
  }

  function resumen() {
    return { lineas, puntos: Math.min(100, lineas * 18), exito: lineas >= META[dif], texto: `${lineas} fila${lineas === 1 ? "" : "s"}` };
  }

  return { iniciar, detener, resumen };
})();

/* ---------- MEMORIA ---------- */
const Memoria = (() => {
  const EMOJIS = ["🍎", "⚽", "🌙", "⭐", "🧼", "🐣", "🌸", "🎈", "🦋", "🍦"];
  const PARES = [4, 6, 8];
  let cont, alTerminar, volteadas, pares, movimientos, bloqueado, total;

  function iniciar(contenedor, dificultad, cb) {
    cont = contenedor;
    alTerminar = cb;
    total = PARES[dificultad];
    pares = 0;
    movimientos = 0;
    volteadas = [];
    bloqueado = false;

    const usados = EMOJIS.slice(0, total);
    const baraja = usados.concat(usados).sort(() => Math.random() - 0.5);
    cont.innerHTML = `
      <p class="juego-ayuda">Encuentra las parejas iguales.</p>
      <div class="memoria-info">🃏 Parejas: <strong id="memoriaPares">0</strong> / ${total} · Intentos: <strong id="memoriaIntentos">0</strong></div>
      <div class="memoria-tablero"></div>`;
    const tablero = cont.querySelector(".memoria-tablero");
    baraja.forEach((emoji) => {
      const b = document.createElement("button");
      b.className = "carta";
      b.innerHTML = `<span class="frente">?</span><span class="dorso">${emoji}</span>`;
      b.dataset.emoji = emoji;
      b.addEventListener("click", () => voltear(b));
      tablero.appendChild(b);
    });
  }

  function detener() { bloqueado = true; }

  function voltear(carta) {
    if (bloqueado || carta.classList.contains("volteada") || carta.classList.contains("lista")) return;
    carta.classList.add("volteada");
    son("toque");
    volteadas.push(carta);
    if (volteadas.length < 2) return;

    movimientos++;
    cont.querySelector("#memoriaIntentos").textContent = movimientos;
    const [a, b] = volteadas;
    volteadas = [];

    if (a.dataset.emoji === b.dataset.emoji) {
      a.classList.add("lista");
      b.classList.add("lista");
      pares++;
      cont.querySelector("#memoriaPares").textContent = pares;
      son("atrapar");
      if (pares === total) terminar();
    } else {
      bloqueado = true;
      setTimeout(() => {
        a.classList.remove("volteada");
        b.classList.remove("volteada");
        bloqueado = false;
      }, 800);
    }
  }

  function terminar() {
    bloqueado = true;
    son("ganar");
    cartelFin(cont, "🎉 ¡Todas las parejas!", `En ${movimientos} intentos`, () => alTerminar(resumen()));
  }

  function resumen() {
    const completo = pares === total;
    // Puntos: completo da al menos 50; menos intentos, más puntos.
    const puntos = completo ? Math.max(50, 100 - (movimientos - total) * 6) : Math.round((pares / total) * 40);
    return { pares, movimientos, total, completo, puntos, exito: completo, casiPerfecto: completo && movimientos <= total + 2, texto: completo ? `${movimientos} intentos` : `${pares} de ${total} parejas` };
  }

  return { iniciar, detener, resumen };
})();

/* ---------- SECUENCIA (tipo Simón) ---------- */
const Secuencia = (() => {
  const COLORES = [
    { id: 0, color: "#ff7b8a", nota: 392 },
    { id: 1, color: "#ffd93d", nota: 494 },
    { id: 2, color: "#6fcf97", nota: 587 },
    { id: 3, color: "#5aa9ff", nota: 698 },
  ];
  const VELOCIDAD = [700, 480, 330];
  const META = [5, 8, 12];
  let cont, alTerminar, dif, secuencia, paso, esperando, terminado, timers, completadas;

  function iniciar(contenedor, dificultad, cb) {
    cont = contenedor;
    dif = dificultad;
    alTerminar = cb;
    secuencia = [];
    completadas = 0; // rondas repetidas correctamente
    terminado = false;
    esperando = false;
    timers = [];

    cont.innerHTML = `
      <p class="juego-ayuda">Mira los colores y repítelos en el mismo orden. Meta: ${META[dif]}.</p>
      <div class="secuencia-info">🎵 Ronda: <strong id="secRonda">0</strong> / ${META[dif]} · <span id="secEstado">Mira…</span></div>
      <div class="secuencia-tablero">
        ${COLORES.map((c) => `<button class="pad" data-id="${c.id}" style="--color:${c.color}"></button>`).join("")}
      </div>`;
    cont.querySelectorAll(".pad").forEach((b) => {
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); tocar(Number(b.dataset.id)); });
    });
    programar(mostrar, 600);
  }

  function programar(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function detener() {
    terminado = true;
    timers.forEach(clearTimeout);
  }

  function nota(id) {
    if (typeof Sonido !== "undefined" && Sonido.tono) Sonido.tono(COLORES[id].nota);
  }

  function encender(id, ms) {
    const pad = cont.querySelector(`.pad[data-id="${id}"]`);
    if (!pad) return;
    pad.classList.add("activo");
    nota(id);
    programar(() => pad.classList.remove("activo"), ms);
  }

  function mostrar() {
    if (terminado) return;
    secuencia.push(Math.floor(Math.random() * 4));
    cont.querySelector("#secRonda").textContent = completadas;
    cont.querySelector("#secEstado").textContent = "Mira…";
    esperando = false;
    const v = VELOCIDAD[dif];
    secuencia.forEach((id, i) => programar(() => encender(id, v * 0.6), 400 + i * v));
    programar(() => {
      if (terminado) return;
      paso = 0;
      esperando = true;
      cont.querySelector("#secEstado").textContent = "¡Tu turno!";
    }, 400 + secuencia.length * v);
  }

  function tocar(id) {
    if (!esperando || terminado) return;
    encender(id, 200);
    if (id !== secuencia[paso]) {
      esperando = false;
      son("no");
      terminar(false);
      return;
    }
    paso++;
    if (paso === secuencia.length) {
      esperando = false;
      completadas++;
      cont.querySelector("#secRonda").textContent = completadas;
      if (completadas >= META[dif]) { terminar(true); return; }
      son("atrapar");
      programar(mostrar, 700);
    }
  }

  function terminar(gano) {
    detener();
    cont.querySelector("#secEstado").textContent = gano ? "¡Ganaste!" : "Uy…";
    if (gano) son("ganar");
    cartelFin(cont, gano ? "🎉 ¡Secuencia completa!" : "Casi…", `Completaste ${completadas} ronda${completadas === 1 ? "" : "s"}`, () => alTerminar(resumen()));
  }

  function resumen() {
    return { ronda: completadas, puntos: Math.min(100, Math.round((completadas / META[dif]) * 100)), exito: completadas >= META[dif], texto: `ronda ${completadas}` };
  }

  return { iniciar, detener, resumen };
})();

/* ---------- CANASTA (atrapa la comida que cae) ---------- */
const Canasta = (() => {
  const BUENOS = ["🍎", "🍌", "🥕", "🍗", "🐟", "🫐", "🥦", "🍞"];
  const MALOS = ["🧦", "🪨", "🧹"];
  const DURACION = [40, 30, 25];
  const META = [10, 15, 20];
  const VEL = [1.6, 2.3, 3.2];
  const CADA = [900, 700, 520];

  let cont, canvas, ctx, alTerminar, dif;
  let items, canastaX, buenas, malas, tiempoFin, timerCrear, anim, terminado, ultimo;

  function iniciar(contenedor, dificultad, cb) {
    cont = contenedor;
    dif = dificultad;
    alTerminar = cb;
    items = [];
    buenas = 0;
    malas = 0;
    terminado = false;

    cont.innerHTML = `
      <p class="juego-ayuda">Mueve la canasta para atrapar la comida. ¡Esquiva los calcetines y piedras! Meta: ${META[dif]}.</p>
      <div class="canasta-info">🧺 <strong id="canastaBuenas">0</strong> / ${META[dif]} · ⏱️ <strong id="canastaTiempo">${DURACION[dif]}</strong> s</div>
      <canvas id="canastaCanvas" class="canasta-canvas"></canvas>`;
    canvas = cont.querySelector("#canastaCanvas");
    ctx = canvas.getContext("2d");
    canvas.width = Math.min(cont.clientWidth, 360);
    canvas.height = Math.min(360, Math.max(240, window.innerHeight - 320));
    canastaX = canvas.width / 2;

    const mover = (e) => {
      const r = canvas.getBoundingClientRect();
      canastaX = Math.max(30, Math.min(canvas.width - 30, e.clientX - r.left));
    };
    canvas.addEventListener("pointerdown", mover);
    canvas.addEventListener("pointermove", (e) => { if (e.buttons || e.pointerType === "touch") mover(e); });
    canvas.addEventListener("touchmove", (e) => { e.preventDefault(); mover(e.touches[0]); }, { passive: false });

    tiempoFin = Date.now() + DURACION[dif] * 1000;
    ultimo = performance.now();
    timerCrear = setInterval(crear, CADA[dif]);
    anim = requestAnimationFrame(paso);
  }

  function detener() {
    terminado = true;
    clearInterval(timerCrear);
    cancelAnimationFrame(anim);
  }

  function crear() {
    const malo = Math.random() < (0.18 + dif * 0.07);
    const lista = malo ? MALOS : BUENOS;
    items.push({ emoji: lista[Math.floor(Math.random() * lista.length)], x: 20 + Math.random() * (canvas.width - 40), y: -20, malo, vel: VEL[dif] * (0.8 + Math.random() * 0.5) });
  }

  function paso(ahora) {
    if (terminado) return;
    const dt = Math.min(40, ahora - ultimo) / 16;
    ultimo = ahora;
    const restante = Math.max(0, Math.ceil((tiempoFin - Date.now()) / 1000));
    cont.querySelector("#canastaTiempo").textContent = restante;

    const cy = canvas.height - 26;
    items.forEach((it) => { it.y += it.vel * dt; });
    items = items.filter((it) => {
      if (it.y > canvas.height + 20) return false;
      if (Math.abs(it.x - canastaX) < 34 && it.y > cy - 20 && it.y < cy + 14) {
        if (it.malo) { malas++; son("no"); } else { buenas++; son("atrapar"); }
        cont.querySelector("#canastaBuenas").textContent = buenas;
        return false;
      }
      return true;
    });

    ctx.fillStyle = "#eaf7ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#b9e8a6";
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
    ctx.font = "28px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    items.forEach((it) => ctx.fillText(it.emoji, it.x, it.y));
    ctx.font = "44px serif";
    ctx.fillText("🧺", canastaX, cy);

    if (restante <= 0 || buenas >= META[dif]) { terminar(); return; }
    anim = requestAnimationFrame(paso);
  }

  function terminar() {
    detener();
    const gano = buenas >= META[dif];
    son(gano ? "ganar" : "toque");
    cartelFin(cont, gano ? "🎉 ¡Canasta llena!" : "⏱️ Se acabó el tiempo", `Atrapaste ${buenas} comida${buenas === 1 ? "" : "s"}${malas ? ` y ${malas} cosa${malas === 1 ? "" : "s"} fea${malas === 1 ? "" : "s"}` : ""}`, () => alTerminar(resumen()));
  }

  function resumen() {
    const netas = Math.max(0, buenas - malas);
    return { buenas, malas, puntos: Math.min(100, Math.round((netas / META[dif]) * 100)), exito: buenas >= META[dif], texto: `${buenas} comidas` };
  }

  return { iniciar, detener, resumen };
})();

/* ---------- NÚMEROS (matemáticas con tiempo) ---------- */
const Numeros = (() => {
  const TOTAL = 10;
  const SEGUNDOS = [15, 10, 8];
  let cont, alTerminar, dif, pregunta, correctas, respondidas, timer, terminado, inicioPregunta, anim;

  function iniciar(contenedor, dificultad, cb) {
    cont = contenedor;
    dif = dificultad;
    alTerminar = cb;
    correctas = 0;
    respondidas = 0;
    terminado = false;

    cont.innerHTML = `
      <p class="juego-ayuda">Toca la respuesta correcta antes de que se acabe la barra.</p>
      <div class="numeros-info">🔢 Pregunta <strong id="numN">1</strong> / ${TOTAL} · ✅ <strong id="numOk">0</strong></div>
      <div class="barra numeros-tiempo"><div id="numBarra"></div></div>
      <div id="numPregunta" class="numeros-pregunta"></div>
      <div id="numOpciones" class="numeros-opciones"></div>`;
    siguiente();
  }

  function detener() {
    terminado = true;
    clearTimeout(timer);
    cancelAnimationFrame(anim);
  }

  function al(n) { return Math.floor(Math.random() * (n + 1)); }

  function generar() {
    let a, b, op, res;
    if (dif === 0) {
      a = al(9); b = al(10 - a); op = "+"; res = a + b;
    } else if (dif === 1) {
      if (Math.random() < 0.5) { a = al(20); b = al(20 - a); op = "+"; res = a + b; }
      else { a = al(20); b = al(a); op = "−"; res = a - b; }
    } else {
      const r = Math.random();
      if (r < 0.5) { a = 2 + al(8); b = 2 + al(8); op = "×"; res = a * b; }
      else if (r < 0.75) { a = 10 + al(40); b = al(50 - a); op = "+"; res = a + b; }
      else { a = 10 + al(40); b = al(a); op = "−"; res = a - b; }
    }
    // Tres opciones: la correcta y dos cercanas distintas
    const opciones = new Set([res]);
    while (opciones.size < 3) {
      const d = (Math.floor(Math.random() * 6) + 1) * (Math.random() < 0.5 ? -1 : 1);
      if (res + d >= 0) opciones.add(res + d);
    }
    return { texto: `${a} ${op} ${b} = ?`, res, opciones: [...opciones].sort(() => Math.random() - 0.5) };
  }

  function siguiente() {
    if (terminado) return;
    if (respondidas >= TOTAL) { terminar(); return; }
    pregunta = generar();
    cont.querySelector("#numN").textContent = respondidas + 1;
    cont.querySelector("#numPregunta").textContent = pregunta.texto;
    const ops = cont.querySelector("#numOpciones");
    ops.innerHTML = "";
    pregunta.opciones.forEach((v) => {
      const b = document.createElement("button");
      b.textContent = v;
      b.addEventListener("click", () => responder(v, b));
      ops.appendChild(b);
    });
    inicioPregunta = Date.now();
    clearTimeout(timer);
    timer = setTimeout(() => responder(null), SEGUNDOS[dif] * 1000);
    barra();
  }

  function barra() {
    if (terminado) return;
    const parte = Math.max(0, 1 - (Date.now() - inicioPregunta) / (SEGUNDOS[dif] * 1000));
    cont.querySelector("#numBarra").style.width = parte * 100 + "%";
    anim = requestAnimationFrame(barra);
  }

  function responder(valor, boton) {
    if (terminado) return;
    clearTimeout(timer);
    cancelAnimationFrame(anim);
    respondidas++;
    const ok = valor === pregunta.res;
    if (ok) { correctas++; son("atrapar"); }
    else son("no");
    cont.querySelector("#numOk").textContent = correctas;
    cont.querySelectorAll("#numOpciones button").forEach((b) => {
      b.disabled = true;
      if (Number(b.textContent) === pregunta.res) b.classList.add("bien");
      else if (b === boton) b.classList.add("mal");
    });
    setTimeout(siguiente, ok ? 500 : 900);
  }

  function terminar() {
    detener();
    const gano = correctas >= 8;
    son(gano ? "ganar" : "toque");
    cartelFin(cont, gano ? "🎉 ¡Qué crack!" : "¡Buen intento!", `${correctas} de ${TOTAL} correctas`, () => alTerminar(resumen()));
  }

  function resumen() {
    return { correctas, total: TOTAL, puntos: correctas * 10, exito: correctas >= 8, perfecto: correctas === TOTAL, texto: `${correctas} de ${TOTAL}` };
  }

  return { iniciar, detener, resumen };
})();

// Para que app.js encuentre cada juego por su nombre
const MOTORES = { bloques: Bloques, memoria: Memoria, secuencia: Secuencia, canasta: Canasta, numeros: Numeros };
