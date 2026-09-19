/* ===== Mi Mascota — lógica del juego ===== */

const CLAVE_GUARDADO = "miMascota2";
const CLAVE_ANTIGUA = "miMascota"; // versión vieja con una sola mascota

const ETAPAS = [
  { nombre: "Huevo misterioso", nivelMinimo: 0 },
  { nombre: "Bebé",             nivelMinimo: 1 },
  { nombre: "Joven",            nivelMinimo: 4 },
  { nombre: "Adulto",           nivelMinimo: 8 },
];

const TOQUES_PARA_NACER = 10;
const XP_POR_NIVEL = 100;
const SEGUNDOS_DORMIR = 8;
const MAX_MASCOTAS = 6;
const SALUD_ENFERMO = 30;   // con menos salud que esto, la mascota está enferma
const MONEDAS_INICIALES = 30;

// Cuánto baja cada estadística por hora mientras la mascota está despierta.
const BAJADA_POR_HORA = { comida: 12, animo: 10, energia: 8, higiene: 5 };
// Tope de tiempo "ausente": aunque pasen días sin abrir el juego,
// la mascota baja como máximo lo que bajaría en estas horas. Así no es cruel.
const MAX_HORAS_AUSENTE = 8;

let datos = null;   // todo lo guardado: la familia, monedas, ropa comprada, logros
let m = null;       // la mascota que se está cuidando ahora
let mensajeHasta = 0;
let timerTick = null;

// Qué está pasando en la escena: "normal" | "yendoCama" | "durmiendo" | "despertando" | "jugando" | "visita"
let modo = "normal";

/* ---------- Utilidades ---------- */
const $ = (id) => document.getElementById(id);
const limitar = (v) => Math.max(0, Math.min(100, v));
const hoy = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
function esAyer(fecha, deHoy) {
  const d = new Date(deHoy + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return fecha === d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
const idNuevo = () => Date.now().toString(36).slice(-5) + Math.floor(Math.random() * 1296).toString(36).padStart(2, "0");
const estacion = () => estacionDeFecha(new Date());

const pantallaFamilia = $("pantallaFamilia");
const pantallaInicio = $("pantallaInicio");
const pantallaJuego = $("pantallaJuego");
const inputNombre = $("inputNombre");
const btnEmpezar = $("btnEmpezar");
const escena = $("escena");
const mascota = $("mascota");
const mascotaImg = $("mascotaImg");
const mensajeEl = $("mensaje");
const pelota = $("pelota");
const efectos = $("efectos");
const juegoInfo = $("juegoInfo");

/* ---------- Sonidos (generados por el navegador, sin archivos) ---------- */
const Sonido = (() => {
  const CLAVE = "miMascotaSonido";
  let ctx = null;
  let silenciado = false;
  try { silenciado = localStorage.getItem(CLAVE) === "off"; } catch (e) { /* sin almacenamiento */ }

  function contexto() {
    if (silenciado) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // Una nota: frecuencia en Hz, cuándo empieza (s), cuánto dura (s), forma de onda, volumen.
  // Si se da "hasta", la frecuencia se desliza hasta ese valor (efecto "boing").
  function nota(freq, inicio, dur, tipo = "sine", vol = 0.18, hasta = null) {
    const c = contexto();
    if (!c) return;
    const t = c.currentTime + inicio;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(freq, t);
    if (hasta) o.frequency.exponentialRampToValueAtTime(hasta, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  const N = { G4: 392, C5: 523, D5: 587, E5: 659, G5: 784, A5: 880, C6: 1047, E6: 1319 };

  return {
    toque:     () => nota(420, 0, 0.08, "triangle", 0.15),
    tono:      (f) => nota(f, 0, 0.25, "triangle", 0.16),
    saludo:    () => nota(500, 0, 0.18, "sine", 0.15, 760),
    no:        () => { nota(220, 0, 0.12, "square", 0.06); nota(180, 0.13, 0.16, "square", 0.06); },
    comer:     () => { nota(160, 0, 0.07, "square", 0.08); nota(140, 0.16, 0.07, "square", 0.08); nota(N.E5, 0.4, 0.15, "sine", 0.12); nota(N.G5, 0.5, 0.2, "sine", 0.12); },
    limpiar:   () => [0, 0.12, 0.26, 0.38].forEach((t, i) => nota(900 + i * 180, t, 0.1, "sine", 0.1)),
    atrapar:   () => nota(300, 0, 0.16, "triangle", 0.18, 640),
    ganar:     () => [N.C5, N.E5, N.G5, N.C6, N.G5, N.C6].forEach((f, i) => nota(f, i * 0.11, i === 5 ? 0.45 : 0.14, "triangle", 0.16)),
    dormir:    () => [N.E5, N.C5, N.G4].forEach((f, i) => nota(f, i * 0.4, 0.5, "sine", 0.1)),
    despertar: () => { nota(N.G5, 0, 0.12, "triangle", 0.14); nota(N.C6, 0.13, 0.22, "triangle", 0.14); },
    nivel:     () => [N.E5, N.G5, N.C6].forEach((f, i) => nota(f, i * 0.1, 0.18, "triangle", 0.16)),
    evolucion: () => [N.C5, N.E5, N.G5, N.C6, N.E6].forEach((f, i) => nota(f, i * 0.13, 0.35, "triangle", 0.15)),
    nacer:     () => [N.C5, N.D5, N.E5, N.G5, N.C6].forEach((f, i) => nota(f, i * 0.12, 0.3, "triangle", 0.16)),
    moneda:    () => { nota(N.A5, 0, 0.08, "square", 0.07); nota(N.E6, 0.09, 0.2, "square", 0.07); },
    logro:     () => [N.G5, N.C6, N.E6, N.C6, N.E6].forEach((f, i) => nota(f, i * 0.1, i === 4 ? 0.5 : 0.12, "triangle", 0.15)),
    vestir:    () => { nota(N.C6, 0, 0.06, "sine", 0.12); nota(N.G5, 0.07, 0.12, "sine", 0.12); },
    estaSilenciado: () => silenciado,
    alternar: () => {
      silenciado = !silenciado;
      try { localStorage.setItem(CLAVE, silenciado ? "off" : "on"); } catch (e) { /* nada */ }
      return silenciado;
    },
  };
})();

const btnSonido = $("btnSonido");
function dibujarBotonSonido() {
  btnSonido.textContent = Sonido.estaSilenciado() ? "🔇" : "🔊";
  btnSonido.setAttribute("aria-label", Sonido.estaSilenciado() ? "Activar sonido" : "Silenciar");
}
btnSonido.addEventListener("click", () => {
  const apagado = Sonido.alternar();
  dibujarBotonSonido();
  if (!apagado) Sonido.toque();
});
dibujarBotonSonido();

/* ---------- Guardar / cargar ---------- */
function guardar() {
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(datos));
  } catch (e) { /* sin almacenamiento: el juego sigue, pero no se guarda */ }
}

function datosVacios() {
  return {
    version: 2,
    mascotas: [],
    actual: null,
    monedas: MONEDAS_INICIALES,
    armario: [],          // ropa comprada o ganada (la comparten todas las mascotas)
    logros: {},           // id → fecha en que se ganó
    contadores: { comidas: 0, sanas: 0, comidasDistintas: {}, dormir: 0, banos: 0, juegos: 0, amigos: {} },
    visitas: {},          // id del amigo → fecha de la última visita premiada
    dificultad: {},       // juego → última dificultad elegida
  };
}

function cargar() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_GUARDADO));
    if (guardado && guardado.version === 2 && Array.isArray(guardado.mascotas)) {
      // Por si faltan campos de versiones intermedias
      const base = datosVacios();
      const d = Object.assign(base, guardado);
      d.contadores = Object.assign(base.contadores, guardado.contadores || {});
      d.mascotas.forEach(completarMascota);
      return d;
    }
  } catch (e) { /* datos corruptos: se empieza de nuevo */ }

  // ¿Hay una mascota de la versión antigua? Se la trae a la familia.
  const d = datosVacios();
  try {
    const vieja = JSON.parse(localStorage.getItem(CLAVE_ANTIGUA));
    if (vieja && vieja.especie && vieja.nombre) {
      const nueva = Object.assign(nuevaMascota(vieja.especie, vieja.nombre), vieja);
      completarMascota(nueva);
      d.mascotas.push(nueva);
      d.actual = nueva.id;
      if (nueva.etapa > 0) d.logros.nacer = hoy();
      localStorage.removeItem(CLAVE_ANTIGUA);
    }
  } catch (e) { /* nada */ }
  return d;
}

function nuevaMascota(especie, nombre) {
  return {
    id: idNuevo(),
    especie,
    nombre,
    etapa: 0,
    toques: 0,
    xp: 0,
    nivel: 1,
    salud: 100,
    comida: 100,
    animo: 100,
    energia: 100,
    higiene: 100,
    durmiendoHasta: 0,
    ultimaVez: Date.now(),
    nacimiento: Date.now(),
    ropa: { cabeza: null, ojos: null, cuello: null, cuerpo: null },
    dia: null,          // tareas del día de hoy
    racha: 0,           // días seguidos cumpliendo las tareas
    diasCumplidos: 0,
    estuvoEnfermo: false,
  };
}

// Rellena campos que puedan faltar en mascotas guardadas antes
function completarMascota(x) {
  const base = nuevaMascota(x.especie, x.nombre);
  for (const k in base) if (x[k] === undefined) x[k] = base[k];
  x.ropa = Object.assign({ cabeza: null, ojos: null, cuello: null, cuerpo: null }, x.ropa || {});
}

/* ---------- Pantalla: familia ---------- */
function mostrarFamilia() {
  clearInterval(timerTick);
  m = null;
  pantallaJuego.hidden = true;
  pantallaInicio.hidden = true;
  pantallaFamilia.hidden = false;

  const lista = $("listaFamilia");
  lista.innerHTML = "";
  datos.mascotas.forEach((x) => {
    aplicarTiempo(x);
    revisarDia(x);
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-mascota" + (x.id === datos.actual ? " actual" : "");
    const estado = x.etapa === 0 ? "🥚" : estaDurmiendo(x) ? "😴" : estaEnfermo(x) ? "🤒" : estadoAnimo(x) === "feliz" ? "😊" : estadoAnimo(x) === "triste" ? "😢" : "🙂";
    const necesita = [];
    if (x.etapa > 0) {
      if (x.comida < 30) necesita.push("🍎");
      if (x.animo < 30) necesita.push("🎮");
      if (x.energia < 25) necesita.push("😴");
      if (x.higiene < 30) necesita.push("🛁");
      if (estaEnfermo(x)) necesita.push("❤️");
    }
    tarjeta.innerHTML = `
      <div class="dibujo">${Personajes.dibujar({ especie: x.especie, etapa: x.etapa, animo: estadoAnimo(x), ropa: x.ropa, toques: x.toques })}</div>
      <div class="info">
        <strong>${escapar(x.nombre)}</strong>
        <small>${x.etapa === 0 ? "Huevo" : ESPECIES[x.especie].nombre + " " + ETAPAS[x.etapa].nombre.toLowerCase()} · Nivel ${x.nivel}</small>
        <small class="necesita">${estado} ${necesita.length ? "Necesita: " + necesita.join(" ") : (x.etapa === 0 ? "Tócalo para que nazca" : "Está bien")}</small>
        ${x.racha > 0 ? `<small>🔥 ${x.racha} día${x.racha === 1 ? "" : "s"} de racha</small>` : ""}
      </div>
      <button class="borrar" aria-label="Borrar mascota">🗑️</button>`;
    tarjeta.addEventListener("click", (e) => {
      if (e.target.classList.contains("borrar")) return;
      Sonido.toque();
      mostrarJuego(x.id);
    });
    tarjeta.querySelector(".borrar").addEventListener("click", () => {
      if (!confirm(`¿Seguro que quieres borrar a ${x.nombre}? No se puede deshacer.`)) return;
      datos.mascotas = datos.mascotas.filter((y) => y.id !== x.id);
      if (datos.actual === x.id) datos.actual = datos.mascotas[0] ? datos.mascotas[0].id : null;
      guardar();
      if (datos.mascotas.length) mostrarFamilia(); else mostrarInicio();
    });
    lista.appendChild(tarjeta);
  });
  guardar();

  const lleno = datos.mascotas.length >= MAX_MASCOTAS;
  $("btnNuevaMascota").disabled = lleno;
  $("btnNuevaMascota").textContent = lleno ? "La familia está completa" : "🥚 Nueva mascota";
}

$("btnNuevaMascota").addEventListener("click", () => { Sonido.toque(); mostrarInicio(); });
$("btnFamilia").addEventListener("click", () => { if (modo === "normal" || modo === "durmiendo") { Sonido.toque(); mostrarFamilia(); } });

function escapar(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- Pantalla: nueva mascota ---------- */
let especieElegida = null;

(function armarHuevos() {
  const cont = $("huevos");
  ORDEN_ESPECIES.forEach((esp) => {
    const b = document.createElement("button");
    b.className = "huevo";
    b.dataset.especie = esp;
    b.innerHTML = `<div class="dibujo">${Personajes.dibujar({ especie: esp, etapa: 0 })}</div><span>${ESPECIES[esp].huevo}</span>`;
    b.addEventListener("click", () => {
      document.querySelectorAll(".huevo").forEach((x) => x.classList.remove("elegido"));
      b.classList.add("elegido");
      especieElegida = esp;
      Sonido.toque();
      revisarFormulario();
    });
    cont.appendChild(b);
  });
})();

inputNombre.addEventListener("input", revisarFormulario);
inputNombre.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !btnEmpezar.disabled) btnEmpezar.click();
});

function revisarFormulario() {
  btnEmpezar.disabled = !(especieElegida && inputNombre.value.trim().length > 0);
}

btnEmpezar.addEventListener("click", () => {
  const nueva = nuevaMascota(especieElegida, inputNombre.value.trim());
  datos.mascotas.push(nueva);
  datos.actual = nueva.id;
  guardar();
  if (datos.mascotas.length >= 2) desbloquearLogro("familia");
  mostrarJuego(nueva.id);
  decir("Tócame para que nazca 🥚", 4000);
});

function mostrarInicio() {
  clearInterval(timerTick);
  m = null;
  especieElegida = null;
  inputNombre.value = "";
  document.querySelectorAll(".huevo").forEach((b) => b.classList.remove("elegido"));
  revisarFormulario();
  pantallaJuego.hidden = true;
  pantallaFamilia.hidden = true;
  pantallaInicio.hidden = false;
  $("btnVolverFamilia").hidden = datos.mascotas.length === 0;
}
$("btnVolverFamilia").addEventListener("click", mostrarFamilia);

/* ---------- Pantalla: el juego ---------- */
function mostrarJuego(id) {
  m = datos.mascotas.find((x) => x.id === id) || datos.mascotas[0];
  if (!m) return mostrarInicio();
  datos.actual = m.id;

  pantallaInicio.hidden = true;
  pantallaFamilia.hidden = true;
  pantallaJuego.hidden = false;
  aplicarTiempo(m);
  revisarDia(m);

  // Si se cerró el juego mientras dormía, aparece ya acostada (sin caminar).
  escena.classList.remove("a-la-cama", "en-cama", "es-noche");
  modo = "normal";
  if (m.durmiendoHasta > 0) {
    modo = "durmiendo";
    escena.classList.add("a-la-cama", "en-cama", "es-noche");
  }

  ultimoDibujo = "";
  avisoEnfermoDado = false;
  aplicarEstacion();
  dibujar();
  guardar();
  clearInterval(timerTick);
  timerTick = setInterval(tick, 1000);
}

/* ---------- Estaciones del año ---------- */
function aplicarEstacion() {
  const est = estacion();
  const info = ESTACIONES[est];
  Object.keys(ESTACIONES).forEach((e) => pantallaJuego.classList.remove("estacion-" + e));
  pantallaJuego.classList.add("estacion-" + est);
  $("estacion").textContent = info.emoji + " " + info.nombre;

  // Cosas que caen: hojas, nieve o pétalos (en verano no cae nada)
  const cont = $("particulas");
  cont.innerHTML = "";
  if (est === "verano") return;
  for (let i = 0; i < 8; i++) {
    const s = document.createElement("span");
    s.textContent = info.particula;
    s.style.left = Math.random() * 95 + "%";
    s.style.animationDuration = 6 + Math.random() * 6 + "s";
    s.style.animationDelay = -Math.random() * 10 + "s";
    s.style.fontSize = 10 + Math.random() * 10 + "px";
    cont.appendChild(s);
  }
}

$("estacion").addEventListener("click", () => {
  const info = ESTACIONES[estacion()];
  abrirPanel(info.emoji + " " + info.nombre, `
    <p class="texto-panel">Estamos en <strong>${info.nombre.toLowerCase()}</strong>. ${info.consejo}</p>
    <div class="estaciones-lista">
      ${Object.keys(ESTACIONES).map((e) => `<div class="${e === estacion() ? "actual" : ""}"><span>${ESTACIONES[e].emoji}</span><small>${ESTACIONES[e].nombre}</small></div>`).join("")}
    </div>
    <p class="texto-panel">En invierno tu mascota necesita <strong>abrigo</strong> (gorro de lana, bufanda o chaleco) y en verano <strong>protección del sol</strong> (gorra, sombrero de paja o lentes). Si no, se cansa y se pone triste más rápido.</p>`);
});

function tieneAbrigo(x) { return Object.values(x.ropa).some((id) => id && ROPA.find((r) => r.id === id && r.abrigo)); }
function tieneProteccionSol(x) { return Object.values(x.ropa).some((id) => id && ROPA.find((r) => r.id === id && r.sol)); }

/* ---------- Paso del tiempo ---------- */
function aplicarTiempo(x) {
  const ahora = Date.now();
  let horas = (ahora - x.ultimaVez) / 3600000;
  x.ultimaVez = ahora;
  if (horas <= 0) return;
  if (horas > MAX_HORAS_AUSENTE) horas = MAX_HORAS_AUSENTE;

  // El huevo no tiene hambre ni sueño.
  if (x.etapa === 0) return;

  if (x.durmiendoHasta > ahora) {
    x.energia = limitar(x.energia + 40 * horas);
    return;
  }

  // Efecto de la estación: sin abrigo en invierno o sin protección en verano se desgasta más.
  const est = estacion();
  let fEnergia = 1, fAnimo = 1, saludExtra = 0;
  if (est === "invierno" && !tieneAbrigo(x)) { fEnergia = 1.5; saludExtra -= 1.5; }
  if (est === "verano" && !tieneProteccionSol(x)) { fAnimo = 1.4; }

  // Se aplica en tramos de 15 min para que la salud solo baje
  // durante el tiempo en que de verdad le faltó algo.
  while (horas > 0) {
    const tramo = Math.min(horas, 0.25);
    horas -= tramo;

    x.comida = limitar(x.comida - BAJADA_POR_HORA.comida * tramo);
    x.animo = limitar(x.animo - BAJADA_POR_HORA.animo * fAnimo * (x.higiene < 30 ? 1.3 : 1) * tramo);
    x.energia = limitar(x.energia - BAJADA_POR_HORA.energia * fEnergia * tramo);
    x.higiene = limitar(x.higiene - BAJADA_POR_HORA.higiene * tramo);

    const descuidada = x.comida < 20 || x.animo < 20 || x.energia < 10 || x.higiene < 15;
    const bienCuidada = x.comida > 50 && x.animo > 50 && x.energia > 30 && x.higiene > 40;
    if (descuidada) x.salud = limitar(x.salud - 6 * tramo);
    else if (bienCuidada) x.salud = limitar(x.salud + 4 * tramo);
    x.salud = limitar(x.salud + saludExtra * tramo);
  }
  if (estaEnfermo(x)) x.estuvoEnfermo = true;
}

function tick() {
  if (!m) return;
  aplicarTiempo(m);
  if (revisarDia(m)) dibujarTareas();
  if (modo === "durmiendo" && Date.now() >= m.durmiendoHasta) despertar();
  revisarSalud();
  dibujar();
  guardar();
}

function estaDurmiendo(x = m) { return x.durmiendoHasta > Date.now(); }
function estaEnfermo(x = m) { return x.etapa > 0 && x.salud < SALUD_ENFERMO; }

// Avisa cuando se enferma y celebra cuando se recupera
let avisoEnfermoDado = false;
function revisarSalud() {
  if (estaEnfermo(m)) {
    if (!m.estuvoEnfermo || !avisoEnfermoDado) {
      m.estuvoEnfermo = true;
      avisoEnfermoDado = true;
      decir("🤒 Me enfermé… Dame comida sana, un baño y descanso.", 5000);
    }
  } else if (m.estuvoEnfermo && m.salud >= 50) {
    m.estuvoEnfermo = false;
    avisoEnfermoDado = false;
    decir("💪 ¡Ya me siento mucho mejor! Gracias.", 4000);
    lluviaDeEstrellas("💖");
    desbloquearLogro("recuperado");
  }
}

/* ---------- Tareas del día (la responsabilidad) ---------- */
// Devuelve true si empezó un día nuevo
function revisarDia(x) {
  const h = hoy();
  if (x.dia && x.dia.fecha === h) return false;
  if (x.dia && !(x.dia.completo && esAyer(x.dia.fecha, h))) x.racha = 0; // se saltó un día o no cumplió
  x.dia = { fecha: h, alimentar: 0, sano: 0, jugar: 0, banar: 0, dormir: 0, dulces: 0, completo: false };
  return true;
}

function tareasDelDia(x) {
  const t = [
    { id: "alimentar", texto: "Darle de comer 2 veces", meta: 2, valor: x.dia.alimentar },
    { id: "sano",      texto: "Una comida saludable",   meta: 1, valor: x.dia.sano },
    { id: "jugar",     texto: "Jugar un rato",          meta: 1, valor: x.dia.jugar },
    { id: "banar",     texto: "Darle un baño",          meta: 1, valor: x.dia.banar },
    { id: "dormir",    texto: "Hacer que duerma",       meta: 1, valor: x.dia.dormir },
  ];
  const est = estacion();
  if (est === "invierno") t.push({ id: "abrigo", texto: "Abrigarlo (gorro, bufanda o chaleco)", meta: 1, valor: tieneAbrigo(x) ? 1 : 0 });
  if (est === "verano") t.push({ id: "sol", texto: "Protegerlo del sol (gorra, sombrero o lentes)", meta: 1, valor: tieneProteccionSol(x) ? 1 : 0 });
  return t;
}

function revisarTareas() {
  if (!m || m.etapa === 0 || m.dia.completo) return;
  const todas = tareasDelDia(m).every((t) => t.valor >= t.meta);
  if (!todas) return;
  m.dia.completo = true;
  m.racha++;
  m.diasCumplidos++;
  m.salud = limitar(m.salud + 10);
  darMonedas(20, "Tareas del día cumplidas");
  Sonido.ganar();
  lluviaDeEstrellas("🌟");
  decir("🌟 ¡Cumpliste todas las tareas de hoy! Racha: " + m.racha + " día" + (m.racha === 1 ? "" : "s"), 5000);
  if (m.racha >= 3) desbloquearLogro("racha3");
  if (m.racha >= 7) desbloquearLogro("racha7");
  if (m.racha >= 30) desbloquearLogro("racha30");
}

function dibujarTareas() {
  if (!m || !m.dia) return;
  const lista = $("listaTareas");
  lista.innerHTML = tareasDelDia(m).map((t) => {
    const hecha = t.valor >= t.meta;
    return `<li class="${hecha ? "hecha" : ""}"><span>${hecha ? "✅" : "⬜"}</span> ${t.texto}${t.meta > 1 ? ` <small>(${Math.min(t.valor, t.meta)}/${t.meta})</small>` : ""}</li>`;
  }).join("");
  $("racha").textContent = "🔥 " + m.racha + " día" + (m.racha === 1 ? "" : "s");
  $("tareasEstado").textContent = m.dia.completo
    ? "¡Todo listo por hoy! Mañana hay tareas nuevas."
    : "Cumple todas las tareas cada día para ganar 🪙 20 y mantener la racha.";
}

/* ---------- Monedas y logros ---------- */
function darMonedas(cantidad, motivo) {
  if (cantidad <= 0) return;
  datos.monedas += cantidad;
  Sonido.moneda();
  aviso(`🪙 +${cantidad}${motivo ? " · " + motivo : ""}`, "monedas");
}

function desbloquearLogro(id) {
  if (datos.logros[id]) return;
  const l = LOGROS.find((x) => x.id === id);
  if (!l) return;
  datos.logros[id] = hoy();
  datos.monedas += l.monedas;
  // Ropa que se regala con el logro
  ROPA.filter((r) => r.logro === id && !datos.armario.includes(r.id)).forEach((r) => datos.armario.push(r.id));
  setTimeout(() => {
    Sonido.logro();
    aviso(`${l.emoji} ¡Logro: ${l.nombre}! +${l.monedas} 🪙`, "logro");
  }, 400);
  revisarLogrosRopa();
  guardar();
}

function revisarLogrosRopa() {
  if (datos.armario.length >= 8) desbloquearLogro("coleccionista");
  if (m && Object.values(m.ropa).filter(Boolean).length >= 3) desbloquearLogro("moda");
  if (m && estacion() === "invierno" && tieneAbrigo(m)) desbloquearLogro("abrigado");
  if (m && estacion() === "verano" && tieneProteccionSol(m)) desbloquearLogro("veraneante");
}

// Avisos flotantes arriba de la pantalla
function aviso(texto, tipo = "") {
  const cont = $("avisos");
  const el = document.createElement("div");
  el.className = "aviso " + tipo;
  el.textContent = texto;
  cont.appendChild(el);
  setTimeout(() => el.classList.add("irse"), 2600);
  setTimeout(() => el.remove(), 3200);
}

/* ---------- Panel genérico ---------- */
const panel = $("panel");
let alCerrarPanel = null;
function abrirPanel(titulo, html, alCerrar) {
  $("panelGenericoTitulo").textContent = titulo;
  $("panelContenido").innerHTML = html;
  alCerrarPanel = alCerrar || null;
  panel.hidden = false;
}
function cerrarPanel() {
  panel.hidden = true;
  $("panelContenido").innerHTML = "";
  if (alCerrarPanel) { const f = alCerrarPanel; alCerrarPanel = null; f(); }
}
$("btnCerrarPanel").addEventListener("click", cerrarPanel);
panel.addEventListener("click", (e) => { if (e.target === panel) cerrarPanel(); });

/* ---------- Alimentar ---------- */
$("btnComer").addEventListener("click", () => {
  if (!m || modo !== "normal") return;
  if (Math.round(m.comida) >= 95) { Sonido.no(); return decir("🍎 No tengo tanta hambre."); }
  Sonido.toque();
  abrirPanelComida();
});

function abrirPanelComida() {
  const est = estacion();
  const favorito = ESPECIES[m.especie].favorito;
  const lista = ALIMENTOS.filter((a) => !a.estacion || a.estacion === est);
  const html = `
    <p class="texto-panel">Las comidas <strong>sanas</strong> 🥗 dan salud. Los <strong>dulces</strong> 🍬 alegran, pero solo uno al día.${m.dia.dulces >= 1 ? " <strong>Hoy ya comió un dulce.</strong>" : ""}</p>
    <div class="rejilla-comida">
      ${lista.map((a) => {
        const sano = TIPOS_SANOS.includes(a.tipo);
        const etiqueta = a.id === favorito ? "⭐ favorito" : a.tipo === "dulce" ? "🍬 dulce" : sano ? "🥗 sano" : "🍞 normal";
        return `<button data-id="${a.id}" class="${a.id === favorito ? "favorito" : ""}"><i>${a.emoji}</i><span>${a.nombre}</span><small>${etiqueta}${a.estacion ? " · " + ESTACIONES[a.estacion].emoji + " de temporada" : ""}</small></button>`;
      }).join("")}
    </div>`;
  abrirPanel("🍎 ¿Qué le damos?", html);
  $("panelContenido").querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => { cerrarPanel(); alimentar(ALIMENTOS.find((a) => a.id === b.dataset.id)); });
  });
}

function alimentar(al) {
  if (modo !== "normal" || !al) return;
  const esDulce = al.tipo === "dulce";
  const esSano = TIPOS_SANOS.includes(al.tipo);
  const favorito = ESPECIES[m.especie].favorito === al.id;
  let comida = al.comida, salud = al.salud, animo = al.animo, xp = esSano ? 12 : esDulce ? 5 : 10;
  let mensaje = esSano ? "😋 ¡Qué rico y sano!" : "😋 ¡Qué rico!";

  if (esDulce) {
    m.dia.dulces++;
    if (m.dia.dulces > 1) {
      salud = -8; animo = 0; xp = 0;
      mensaje = "🤢 ¡Mucho dulce hoy! Me duele la pancita.";
    } else {
      mensaje = "😋 ¡Mmm, dulce! Pero solo uno al día.";
    }
  }
  if (favorito) { animo += 6; mensaje = "🤩 ¡Mi comida favorita! Gracias."; }

  m.comida = limitar(m.comida + comida);
  m.salud = limitar(m.salud + salud);
  m.animo = limitar(m.animo + animo);
  m.higiene = limitar(m.higiene - 3);
  m.dia.alimentar++;
  if (esSano) m.dia.sano++;

  const c = datos.contadores;
  c.comidas++;
  if (esSano) c.sanas++;
  c.comidasDistintas[al.id] = 1;
  desbloquearLogro("primera-comida");
  if (Object.keys(c.comidasDistintas).length >= 8) desbloquearLogro("gourmet");
  if (c.sanas >= 20) desbloquearLogro("sano");

  Sonido.comer();
  const pos = posicionMascota();
  efecto(al.emoji, pos.x - 70, pos.alto * 0.45, "comer");
  setTimeout(() => {
    animar("brinco");
    efecto(salud < 0 && m.dia.dulces > 1 ? "💫" : "💕", pos.x, pos.alto + 6);
  }, 650);
  decir(mensaje, 3000);
  if (xp) ganarXP(xp);
  revisarTareas();
  terminarAccion();
}

/* ---------- Bañar ---------- */
$("btnBanar").addEventListener("click", () => {
  if (!m || modo !== "normal") return;
  if (Math.round(m.higiene) >= 95) { Sonido.no(); return decir("✨ Ya estoy limpio."); }
  m.higiene = 100;
  m.salud = limitar(m.salud + 8);
  m.animo = limitar(m.animo + 3);
  m.dia.banar++;
  datos.contadores.banos++;
  if (datos.contadores.banos >= 10) desbloquearLogro("limpito");
  Sonido.limpiar();
  animar("brinco");
  const pos = posicionMascota();
  ["🫧", "🫧", "✨", "🫧", "🫧"].forEach((e, i) => {
    setTimeout(() => efecto(e, pos.x - 50 + i * 26, 20 + Math.random() * 70), i * 140);
  });
  decir("🛁 ¡Qué rico baño! Gracias.");
  ganarXP(8);
  revisarTareas();
  terminarAccion();
});

function terminarAccion() {
  guardar();
  dibujar();
}

/* ---------- Dormir: camina a la cama, se tapa, se hace de noche ---------- */
$("btnDormir").addEventListener("click", () => {
  if (!m || modo !== "normal") return;
  if (Math.round(m.energia) >= 95) { Sonido.no(); return decir("👀 No tengo sueño."); }
  irADormir();
});

function irADormir() {
  modo = "yendoCama";
  escena.classList.add("a-la-cama");
  mascota.classList.add("moviendo");
  Sonido.dormir();
  decir("🛏️ Me voy a la cama…", 2000);
  dibujar();

  setTimeout(() => {
    mascota.classList.remove("moviendo");
    escena.classList.add("en-cama", "es-noche");
    m.durmiendoHasta = Date.now() + SEGUNDOS_DORMIR * 1000;
    modo = "durmiendo";
    m.dia.dormir++;
    datos.contadores.dormir++;
    if (datos.contadores.dormir >= 10) desbloquearLogro("dormilon");
    decir("😴 Zzz…", SEGUNDOS_DORMIR * 1000);
    revisarTareas();
    terminarAccion();
  }, 1000);
}

function despertar() {
  m.durmiendoHasta = 0;
  m.energia = limitar(m.energia + 40);
  m.salud = limitar(m.salud + 10);
  modo = "despertando";
  escena.classList.remove("en-cama", "es-noche");
  Sonido.despertar();
  decir("🌞 ¡Buenos días!", 2500);
  dibujar();

  setTimeout(() => {
    escena.classList.remove("a-la-cama");
    mascota.classList.add("moviendo");
    setTimeout(() => {
      mascota.classList.remove("moviendo");
      modo = "normal";
      animar("brinco");
      decir("🌞 ¡Qué bien dormí!");
      ganarXP(5);
      terminarAccion();
    }, 1000);
  }, 700);
}

/* ---------- Ropa: armario y tienda ---------- */
$("btnRopa").addEventListener("click", () => {
  if (!m || modo !== "normal") return;
  if (m.etapa === 0) { Sonido.no(); return decir("🥚 Primero tiene que nacer."); }
  Sonido.toque();
  abrirPanelRopa();
});

function abrirPanelRopa() {
  const est = estacion();
  const html = `
    <div class="ropa-vista"><div class="dibujo" id="ropaVista"></div>
      <div class="ropa-vista-info"><strong>${escapar(m.nombre)}</strong><span>🪙 <strong id="ropaMonedas">${datos.monedas}</strong></span>
      <button id="btnQuitarTodo" class="chico">Quitar todo</button></div></div>
    ${ZONAS_ROPA.map((z) => `
      <h4 class="ropa-zona">${z.emoji} ${z.nombre}</h4>
      <div class="rejilla-ropa">
        ${ROPA.filter((r) => r.zona === z.id).map((r) => {
          const tiene = datos.armario.includes(r.id);
          const puesta = m.ropa[z.id] === r.id;
          const clima = (est === "invierno" && r.abrigo) ? "❄️ abriga" : (est === "verano" && r.sol) ? "☀️ protege" : r.abrigo ? "abriga" : r.sol ? "sol" : "";
          let estado;
          if (puesta) estado = "✅ puesta";
          else if (tiene) estado = "Ponerle";
          else if (r.logro) { const l = LOGROS.find((x) => x.id === r.logro); estado = "🔒 " + (l ? l.nombre : ""); }
          else estado = "🪙 " + r.precio;
          return `<button data-id="${r.id}" class="${puesta ? "puesta" : tiene ? "tiene" : r.logro ? "bloqueada" : "comprar"}"><i>${r.emoji}</i><span>${r.nombre}</span><small>${clima ? clima + " · " : ""}${estado}</small></button>`;
        }).join("")}
      </div>`).join("")}`;
  abrirPanel("👕 Ropa", html);
  actualizarVistaRopa();

  $("btnQuitarTodo").addEventListener("click", () => {
    ZONAS_ROPA.forEach((z) => { m.ropa[z.id] = null; });
    Sonido.vestir();
    guardar();
    abrirPanelRopa();
  });

  $("panelContenido").querySelectorAll(".rejilla-ropa button").forEach((b) => {
    b.addEventListener("click", () => {
      const r = ROPA.find((x) => x.id === b.dataset.id);
      const tiene = datos.armario.includes(r.id);
      if (!tiene) {
        if (r.logro) { Sonido.no(); aviso("🔒 Se gana con el logro: " + LOGROS.find((x) => x.id === r.logro).nombre); return; }
        if (datos.monedas < r.precio) { Sonido.no(); aviso("🪙 Te faltan " + (r.precio - datos.monedas) + " monedas. ¡Juega y cumple las tareas!"); return; }
        if (!confirm(`¿Comprar ${r.nombre} por ${r.precio} monedas?`)) return;
        datos.monedas -= r.precio;
        datos.armario.push(r.id);
        Sonido.moneda();
        aviso("🛍️ ¡Compraste " + r.nombre + "!");
      }
      // Ponérsela o quitársela
      m.ropa[r.zona] = m.ropa[r.zona] === r.id ? null : r.id;
      Sonido.vestir();
      revisarLogrosRopa();
      guardar();
      abrirPanelRopa();
    });
  });
}

function actualizarVistaRopa() {
  const v = $("ropaVista");
  if (v) v.innerHTML = Personajes.dibujar({ especie: m.especie, etapa: m.etapa, animo: "feliz", ropa: m.ropa });
}

/* ---------- Logros ---------- */
$("btnLogros").addEventListener("click", () => {
  Sonido.toque();
  const ganados = LOGROS.filter((l) => datos.logros[l.id]).length;
  abrirPanel("🏅 Logros", `
    <p class="texto-panel">Has ganado <strong>${ganados}</strong> de ${LOGROS.length} medallas. Cada una regala monedas 🪙.</p>
    <div class="rejilla-logros">
      ${LOGROS.map((l) => `<div class="${datos.logros[l.id] ? "ganado" : ""}"><i>${datos.logros[l.id] ? l.emoji : "🔒"}</i><span>${l.nombre}</span><small>${l.pista}</small></div>`).join("")}
    </div>`);
});

/* ---------- Amigos: visitas entre teléfonos sin internet ----------
   Cada mascota tiene un código. Se comparte con el botón del teléfono
   (Quick Share, Bluetooth, WhatsApp…) y el amigo lo pega en su app. */
function codigoVisita(x) {
  const ropa = ZONAS_ROPA.map((z) => {
    const i = x.ropa[z.id] ? ROPA.findIndex((r) => r.id === x.ropa[z.id]) : -1;
    return i < 0 ? "_" : i.toString(36);
  }).join("");
  return ["MM", x.id, ORDEN_ESPECIES.indexOf(x.especie), x.etapa, x.nivel, ropa, x.nombre].join("-");
}

function leerCodigo(texto) {
  const partes = String(texto || "").trim().split("-");
  if (partes.length < 7 || partes[0].toUpperCase() !== "MM") return null;
  const [, id, esp, etapa, nivel, ropaTxt, ...resto] = partes;
  const especie = ORDEN_ESPECIES[Number(esp)];
  const nombre = resto.join("-").trim();
  if (!especie || !nombre || !/^[a-z0-9]{3,12}$/i.test(id)) return null;
  const ropa = {};
  ZONAS_ROPA.forEach((z, i) => {
    const ch = ropaTxt[i];
    const r = ch && ch !== "_" ? ROPA[parseInt(ch, 36)] : null;
    ropa[z.id] = r && r.zona === z.id ? r.id : null;
  });
  return { id, especie, etapa: Math.max(1, Math.min(3, Number(etapa) || 1)), nivel: Math.max(1, Number(nivel) || 1), ropa, nombre: nombre.slice(0, 14) };
}

$("btnAmigos").addEventListener("click", () => {
  if (!m || modo !== "normal") return;
  if (m.etapa === 0) { Sonido.no(); return decir("🥚 Primero tiene que nacer."); }
  Sonido.toque();
  const codigo = codigoVisita(m);
  const puedeCompartir = !!navigator.share;
  abrirPanel("🤝 Amigos", `
    <p class="texto-panel">Invita a la mascota de un amigo a jugar. <strong>No necesita internet:</strong> envía tu código con Quick Share, Bluetooth o WhatsApp y pídele el suyo.</p>
    <div class="codigo-caja">
      <small>Tu código</small>
      <code id="codigoPropio">${escapar(codigo)}</code>
      <div class="fila-botones">
        ${puedeCompartir ? `<button id="btnCompartirCodigo">📤 Compartir</button>` : ""}
        <button id="btnCopiarCodigo">📋 Copiar</button>
      </div>
    </div>
    <label class="campo chico">Pega aquí el código de tu amigo
      <input id="inputCodigo" type="text" placeholder="MM-…" autocomplete="off" autocapitalize="off">
    </label>
    <button id="btnRecibirVisita" class="principal">🎉 ¡Que venga a jugar!</button>
    <p class="texto-panel chico">Cada amigo distinto da premio una vez al día.</p>`);

  const compartir = $("btnCompartirCodigo");
  if (compartir) compartir.addEventListener("click", () => {
    navigator.share({ title: "Mi Mascota", text: `¡${m.nombre} quiere visitar a tu mascota! Pega este código en Mi Mascota: ${codigo}` }).catch(() => {});
  });
  $("btnCopiarCodigo").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(codigo); aviso("📋 Código copiado"); }
    catch (e) { aviso("Mantén presionado el código para copiarlo"); }
  });
  $("btnRecibirVisita").addEventListener("click", () => {
    const texto = $("inputCodigo").value;
    // Si pegaron el mensaje completo, se busca el código adentro
    const encontrado = (texto.match(/MM-[^\s]+(?:\s+[^\s]+)*/) || [texto])[0];
    const amigo = leerCodigo(encontrado);
    if (!amigo) { Sonido.no(); aviso("❌ Ese código no se entiende. Revísalo."); return; }
    if (amigo.id === m.id) { Sonido.no(); aviso("😄 ¡Ese es tu propio código!"); return; }
    cerrarPanel();
    recibirVisita(amigo);
  });
});

function recibirVisita(amigo) {
  modo = "visita";
  const el = $("amigo");
  el.querySelector(".dibujo").innerHTML = Personajes.dibujar({ especie: amigo.especie, etapa: amigo.etapa, animo: "feliz", ropa: amigo.ropa });
  el.querySelector(".nombre-amigo").textContent = amigo.nombre;
  el.classList.remove("irse", "llega");
  el.hidden = false;
  void el.offsetWidth; // para que la animación de entrada se vea
  el.classList.add("llega");
  Sonido.saludo();
  decir("👋 ¡Llegó " + amigo.nombre + " de visita!", 3000);
  dibujar();

  const premiar = datos.visitas[amigo.id] !== hoy();
  setTimeout(() => {
    animar("brinco");
    const pos = posicionMascota();
    ["💕", "🎈", "💕", "⭐"].forEach((e, i) => setTimeout(() => efecto(e, pos.x - 60 + i * 30, pos.alto * 0.7 + Math.random() * 30), i * 250));
    Sonido.ganar();
    decir("🎉 ¡Jugamos juntos! ¡Qué divertido!", 3500);
  }, 1800);

  setTimeout(() => {
    m.animo = limitar(m.animo + 15);
    m.energia = limitar(m.energia - 8);
    if (premiar) {
      datos.visitas[amigo.id] = hoy();
      datos.contadores.amigos[amigo.id] = 1;
      darMonedas(10, "Visita de " + amigo.nombre);
      ganarXP(15);
      desbloquearLogro("amigos");
      if (Object.keys(datos.contadores.amigos).length >= 5) desbloquearLogro("popular");
    }
    m.dia.jugar++;
    revisarTareas();
    terminarAccion();
  }, 4500);

  setTimeout(() => {
    el.classList.remove("llega");
    el.classList.add("irse");
    decir("👋 ¡Chao, " + amigo.nombre + "! Vuelve pronto.", 2500);
    setTimeout(() => { el.hidden = true; modo = "normal"; terminarAccion(); }, 900);
  }, 8000);
}

/* ---------- Minijuegos ---------- */
const panelJuegos = $("panelJuegos");
const zonaJuego = $("zonaJuego");
let juegoElegido = null;   // id del juego elegido en el menú
let juegoActivo = null;    // id del juego que se está jugando en el panel
let dificultadActual = 0;

$("btnJugar").addEventListener("click", () => {
  if (!m || modo !== "normal") return;
  if (estaEnfermo()) { Sonido.no(); return decir("🤒 Estoy enfermo… primero cuídame: comida sana, baño y dormir."); }
  if (Math.round(m.energia) < 20) { Sonido.no(); return decir("😴 Estoy muy cansado para jugar. Déjame dormir."); }
  Sonido.toque();
  abrirPanelJuegos();
});

(function armarMenuJuegos() {
  const cont = $("elegirJuego");
  MINIJUEGOS.forEach((j) => {
    const b = document.createElement("button");
    b.dataset.juego = j.id;
    b.innerHTML = `<i>${j.emoji}</i><span>${j.nombre}</span><small>${j.ayuda}</small>`;
    b.addEventListener("click", () => { Sonido.toque(); elegirDificultad(j); });
    cont.appendChild(b);
  });
})();

function abrirPanelJuegos() {
  modo = "jugando";
  juegoActivo = null;
  juegoElegido = null;
  $("panelTitulo").textContent = "¿A qué jugamos?";
  $("elegirJuego").hidden = false;
  $("elegirDificultad").hidden = true;
  zonaJuego.hidden = true;
  zonaJuego.innerHTML = "";
  panelJuegos.hidden = false;
  dibujar();
}

function elegirDificultad(j) {
  juegoElegido = j.id;
  $("panelTitulo").textContent = j.emoji + " " + j.nombre;
  $("elegirJuego").hidden = true;
  $("elegirDificultad").hidden = false;
  $("dificultadAyuda").textContent = "¿Qué tan difícil? Más difícil = más monedas y experiencia.";
  const ultima = datos.dificultad[j.id] || 0;
  const cont = $("elegirDificultad").querySelector(".dificultades");
  cont.innerHTML = DIFICULTADES.map((d, i) => `<button data-dif="${i}" class="${i === ultima ? "elegida" : ""}"><i>${d.emoji}</i><span>${d.nombre}</span><small>×${d.mult} premio</small></button>`).join("");
  cont.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      Sonido.toque();
      dificultadActual = Number(b.dataset.dif);
      datos.dificultad[j.id] = dificultadActual;
      empezarJuegoElegido();
    });
  });
}

function empezarJuegoElegido() {
  $("elegirDificultad").hidden = true;
  if (juegoElegido === "pelota") {
    cerrarPanelJuegos();
    empezarPelota();
    return;
  }
  juegoActivo = juegoElegido;
  zonaJuego.hidden = false;
  MOTORES[juegoActivo].iniciar(zonaJuego, dificultadActual, (resultado) => terminarJuegoPanel(juegoActivo, resultado));
}

function cerrarPanelJuegos() {
  panelJuegos.hidden = true;
  zonaJuego.innerHTML = "";
  juegoActivo = null;
}

$("btnSalirJuego").addEventListener("click", () => {
  if (!juegoActivo) { // estaba en el menú: no jugó nada
    cerrarPanelJuegos();
    modo = "normal";
    terminarAccion();
    return;
  }
  const motor = MOTORES[juegoActivo];
  motor.detener();
  terminarJuegoPanel(juegoActivo, motor.resumen());
});

function terminarJuegoPanel(cual, r) {
  cerrarPanelJuegos();
  modo = "normal";
  premiarJuego(cual, dificultadActual, r);
}

// Premio según cómo le fue y la dificultad. Siempre gasta energía para que no se juegue sin parar.
function premiarJuego(cual, dif, r) {
  const mult = DIFICULTADES[dif].mult;
  const parte = limitar(r.puntos || 0) / 100;
  const animo = Math.round(8 + 17 * parte);
  const energia = 10 + dif * 3;
  const xp = Math.round((8 + 27 * parte) * mult);
  const monedas = Math.round((3 + 12 * parte) * mult) + (r.exito ? Math.round(5 * mult) : 0);

  m.animo = limitar(m.animo + animo);
  m.energia = limitar(m.energia - energia);
  m.comida = limitar(m.comida - 5);
  m.higiene = limitar(m.higiene - 4);
  m.dia.jugar++;

  const c = datos.contadores;
  c.juegos++;
  if (c.juegos >= 10) desbloquearLogro("deportista");
  if (r.exito && dif === 2) desbloquearLogro("campeon");
  if (cual === "bloques" && r.lineas >= 5) desbloquearLogro("constructor");
  if (cual === "memoria" && r.casiPerfecto && dif >= 1) desbloquearLogro("memoria-pro");
  if (cual === "numeros" && r.perfecto) desbloquearLogro("matematico");
  if (cual === "secuencia" && r.ronda >= 8) desbloquearLogro("oido-fino");
  if (cual === "canasta" && r.buenas >= 20) desbloquearLogro("cocinero");

  const j = MINIJUEGOS.find((x) => x.id === cual);
  if (r.exito) {
    decir(`${j.emoji} ¡Ganaste! ${r.texto}. ¡Eres genial!`, 3500);
    Sonido.ganar();
    lluviaDeEstrellas();
  } else if (parte > 0) {
    decir(`${j.emoji} ¡Buen intento! ${r.texto}.`, 3000);
  } else {
    decir("🙁 ¿Jugamos de nuevo después?", 2500);
  }
  animar("brinco");
  if (xp > 0) ganarXP(xp);
  darMonedas(monedas, j.nombre);
  revisarTareas();
  terminarAccion();
}

/* ---------- Minijuego en la escena: "Atrapa la pelota" ---------- */
const PELOTA_META = [5, 8, 10];
const PELOTA_SEGUNDOS = [3.2, 2.2, 1.5];
let atrapadas = 0, escapadas = 0;
let timerPelota = null;

function empezarPelota() {
  modo = "jugando";
  atrapadas = 0;
  escapadas = 0;
  $("atrapadas").textContent = "0";
  $("atrapadasMeta").textContent = PELOTA_META[dificultadActual];
  juegoInfo.hidden = false;
  pelota.classList.toggle("chica", dificultadActual === 2);
  decir("⚽ ¡Toca la pelota!", 3000);
  ponerPelota();
  dibujar();
}

function ponerPelota() {
  pelota.style.left = 12 + Math.random() * 76 + "%";
  pelota.style.bottom = 20 + Math.random() * 110 + "px";
  pelota.hidden = false;
  pelota.classList.remove("rebotar");
  void pelota.offsetWidth;
  pelota.classList.add("rebotar");
  clearTimeout(timerPelota);
  timerPelota = setTimeout(() => {
    if (modo !== "jugando") return;
    escapadas++;
    efecto("💨", (parseFloat(pelota.style.left) / 100) * escena.clientWidth, parseFloat(pelota.style.bottom) + 10);
    siguientePelota();
  }, PELOTA_SEGUNDOS[dificultadActual] * 1000);
}

function siguientePelota() {
  if (atrapadas + escapadas >= PELOTA_META[dificultadActual]) terminarPelota();
  else ponerPelota();
}

pelota.addEventListener("click", () => {
  if (modo !== "jugando" || pelota.hidden) return;
  clearTimeout(timerPelota);
  atrapadas++;
  $("atrapadas").textContent = atrapadas;
  Sonido.atrapar();

  const x = pelota.style.left;
  const y = Math.max(12, parseFloat(pelota.style.bottom) - 40);
  const px = (parseFloat(x) / 100) * escena.clientWidth;
  efecto("⭐", px, parseFloat(pelota.style.bottom) + 20, "estrella");
  pelota.hidden = true;
  mascota.style.left = x;
  mascota.style.bottom = y + "px";
  mascota.classList.add("moviendo");

  setTimeout(() => {
    mascota.classList.remove("moviendo");
    animar("brinco");
    siguientePelota();
  }, 700);
});

$("btnTerminarJuego").addEventListener("click", () => {
  if (modo === "jugando") terminarPelota();
});

function terminarPelota() {
  clearTimeout(timerPelota);
  pelota.hidden = true;
  juegoInfo.hidden = true;
  mascota.style.left = "";
  mascota.style.bottom = "";
  mascota.classList.remove("moviendo");
  modo = "normal";
  const meta = PELOTA_META[dificultadActual];
  premiarJuego("pelota", dificultadActual, {
    puntos: Math.round((atrapadas / meta) * 100),
    exito: atrapadas >= Math.ceil(meta * 0.8),
    texto: `${atrapadas} de ${meta} atrapadas`,
  });
}

/* Tocar a la mascota: el huevo se va rompiendo; la mascota nacida saluda. */
mascota.addEventListener("click", () => {
  if (!m) return;
  if (m.etapa === 0) {
    m.toques++;
    animar("tambalear");
    if (m.toques >= TOQUES_PARA_NACER) {
      m.etapa = 1;
      animar("evolucionar");
      Sonido.nacer();
      lluviaDeEstrellas("✨");
      decir("🐣 ¡Nació " + m.nombre + "! Ahora cuídalo todos los días.", 5000);
      desbloquearLogro("nacer");
    } else {
      Sonido.toque();
      const frases = ["Se movió…", "¡Algo pasa adentro!", "Crac…", "Casi…"];
      decir(frases[Math.min(frases.length - 1, Math.floor(m.toques / 3))], 1200);
    }
  } else if (modo === "normal") {
    animar("brinco");
    Sonido.saludo();
    const saludos = ["¡Hola! 👋", "¡Te quiero! 💕", "¡Jiji! 😄", "¿Jugamos? ⚽", "¡Gracias por cuidarme! 🌟"];
    decir(saludos[Math.floor(Math.random() * saludos.length)], 1500);
  }
  terminarAccion();
});

/* ---------- Experiencia y evolución ---------- */
function ganarXP(cantidad) {
  m.xp += cantidad;
  while (m.xp >= XP_POR_NIVEL) {
    m.xp -= XP_POR_NIVEL;
    m.nivel++;
    decir("🎉 ¡Subiste al nivel " + m.nivel + "!", 3500);
    Sonido.nivel();
    lluviaDeEstrellas("⭐");
    darMonedas(5 + m.nivel, "Nivel " + m.nivel);
    if (m.nivel >= 5) desbloquearLogro("nivel5");
    if (m.nivel >= 10) desbloquearLogro("nivel10");
    revisarEvolucion();
  }
}

function revisarEvolucion() {
  for (let i = ETAPAS.length - 1; i > m.etapa; i--) {
    if (m.nivel >= ETAPAS[i].nivelMinimo) {
      m.etapa = i;
      animar("evolucionar");
      Sonido.evolucion();
      lluviaDeEstrellas("✨");
      decir("🌟 ¡" + m.nombre + " evolucionó a " + ETAPAS[i].nombre + "!", 5000);
      if (i === 3) desbloquearLogro("adulto");
      break;
    }
  }
}

/* ---------- Mensajes, animaciones y efectos ---------- */
function decir(texto, ms = 2500) {
  mensajeEl.textContent = texto;
  mensajeHasta = Date.now() + ms;
}

function animar(nombre) {
  mascota.classList.remove("tambalear", "brinco", "evolucionar");
  void mascota.offsetWidth; // reinicia la animación aunque sea la misma
  mascota.classList.add(nombre);
  setTimeout(() => mascota.classList.remove(nombre), 1100);
}

// Dónde está la mascota dentro de la escena (x = centro en px, alto = px desde abajo hasta su cabeza)
function posicionMascota() {
  const e = escena.getBoundingClientRect();
  const mm = mascota.getBoundingClientRect();
  return { x: mm.left - e.left + mm.width / 2, alto: e.bottom - mm.top, base: e.bottom - mm.bottom };
}

// Un emoji que aparece en (x px desde la izquierda, y px desde abajo) y desaparece solo.
function efecto(emoji, x, y, clase = "") {
  const el = document.createElement("span");
  el.className = "efecto " + clase;
  el.textContent = emoji;
  el.style.left = x + "px";
  el.style.bottom = y + "px";
  if (clase === "estrella") {
    el.style.setProperty("--dx", (Math.random() * 80 - 40) + "px");
    el.style.setProperty("--dy", (-30 - Math.random() * 50) + "px");
  }
  efectos.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

function lluviaDeEstrellas(emoji = "⭐") {
  const pos = posicionMascota();
  for (let i = 0; i < 7; i++) {
    setTimeout(() => efecto(emoji, pos.x + (Math.random() * 100 - 50), pos.alto * 0.6, "estrella"), i * 90);
  }
}

function mensajeDeEstado() {
  if (m.etapa === 0) return "Tócame para que nazca 🥚";
  if (modo === "jugando") return pelota.hidden ? "🎮 Jugando…" : "⚽ ¡Toca la pelota!";
  if (estaDurmiendo()) return "😴 Zzz…";
  if (estaEnfermo()) return "🤒 Estoy enfermo… comida sana, baño y descanso.";
  if (m.comida < 30) return "🍎 Tengo hambre.";
  if (m.energia < 25) return "😴 Tengo sueño.";
  if (m.higiene < 30) return "🫧 Necesito un baño.";
  if (m.animo < 30) return "⚽ ¡Quiero jugar!";
  const est = estacion();
  if (est === "invierno" && !tieneAbrigo(m)) return "🥶 Tengo frío… ¿me abrigas?";
  if (est === "verano" && !tieneProteccionSol(m)) return "🥵 Hace calor… ¿me pones gorra o lentes?";
  if (m.salud < 60) return "😐 Cuídame bien para sentirme mejor.";
  const promedio = (m.salud + m.comida + m.animo + m.energia + m.higiene) / 5;
  if (promedio >= 65) return "😊 ¡Estoy feliz!";
  return "🙂 Estoy bien.";
}

function estadoAnimo(x = m) {
  if (x.etapa === 0) return "huevo";
  if (estaDurmiendo(x)) return "dormido";
  if (estaEnfermo(x)) return "triste";
  const promedio = (x.salud + x.comida + x.animo + x.energia + x.higiene) / 5;
  if (promedio >= 65) return "feliz";
  if (promedio >= 35) return "normal";
  return "triste";
}

/* ---------- Dibujar en pantalla ---------- */
let ultimoDibujo = "";
function dibujar() {
  if (!m) return;
  const etapa = ETAPAS[m.etapa];
  $("etapaTexto").textContent = m.etapa === 0 ? etapa.nombre : ESPECIES[m.especie].nombre + " " + etapa.nombre.toLowerCase();
  $("nombreMascota").textContent = m.nombre;

  // Dibujo de la mascota (solo se vuelve a generar si cambió algo)
  const animo = estadoAnimo();
  const clave = [m.especie, m.etapa, animo, JSON.stringify(m.ropa), m.toques].join("|");
  if (clave !== ultimoDibujo) {
    ultimoDibujo = clave;
    mascotaImg.innerHTML = Personajes.dibujar({ especie: m.especie, etapa: m.etapa, animo, ropa: m.ropa, toques: m.toques });
  }
  ["huevo", "dormido", "feliz", "normal", "triste"].forEach((c) => mascota.classList.remove(c));
  mascota.classList.add(animo);
  mascota.classList.toggle("enfermo", estaEnfermo());

  if (Date.now() >= mensajeHasta) mensajeEl.textContent = mensajeDeEstado();

  pantallaJuego.classList.toggle("es-huevo", m.etapa === 0);
  $("huevoProgreso").hidden = m.etapa !== 0;
  $("huevoBarra").style.width = (m.toques / TOQUES_PARA_NACER) * 100 + "%";

  ["salud", "comida", "animo", "energia", "higiene"].forEach((clave) => {
    const valor = Math.round(m[clave]);
    $(clave).textContent = valor;
    $(clave + "Barra").style.width = valor + "%";
    document.querySelector('.stat[data-stat="' + clave + '"]').classList.toggle("bajo", valor < 30);
  });

  $("nivel").textContent = m.nivel;
  $("xp").textContent = m.xp;
  $("xpBarra").style.width = (m.xp / XP_POR_NIVEL) * 100 + "%";
  $("monedas").textContent = datos.monedas;

  const ocupada = modo !== "normal";
  ["btnComer", "btnJugar", "btnDormir", "btnBanar", "btnRopa", "btnAmigos"].forEach((id) => { $(id).disabled = ocupada; });
  $("btnJugar").classList.toggle("bloqueado", estaEnfermo());

  document.querySelectorAll("#evolucionRuta span").forEach((el) => {
    const nEtapa = Number(el.dataset.etapa);
    el.classList.toggle("logrado", nEtapa < m.etapa);
    el.classList.toggle("actual", nEtapa === m.etapa);
  });

  dibujarTareas();
}

/* ---------- Instalar como app ---------- */
let avisoInstalar = null;
const cajaInstalar = $("instalar");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  avisoInstalar = e;
  let cerrado = false;
  try { cerrado = sessionStorage.getItem("instalarCerrado") === "1"; } catch (err) { /* nada */ }
  if (!cerrado) cajaInstalar.hidden = false;
});

$("btnInstalar").addEventListener("click", async () => {
  if (!avisoInstalar) return;
  avisoInstalar.prompt();
  await avisoInstalar.userChoice;
  avisoInstalar = null;
  cajaInstalar.hidden = true;
});

$("btnCerrarInstalar").addEventListener("click", () => {
  cajaInstalar.hidden = true;
  try { sessionStorage.setItem("instalarCerrado", "1"); } catch (err) { /* nada */ }
});

window.addEventListener("appinstalled", () => { cajaInstalar.hidden = true; });

/* ---------- Arranque ---------- */
datos = cargar();
if (datos.mascotas.length === 0) mostrarInicio();
else if (datos.mascotas.length === 1) mostrarJuego(datos.mascotas[0].id);
else mostrarFamilia();

// Al volver a la pestaña/app, ponerse al día con el tiempo que pasó.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && m) { tick(); aplicarEstacion(); }
});
