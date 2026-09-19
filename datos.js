/* ===== Mi Mascota — datos del juego =====
   Aquí viven las listas que definen el juego: especies, comidas, ropa,
   logros y estaciones. Para agregar cosas nuevas basta con sumar líneas aquí. */

/* ---------- Especies ---------- */
const ESPECIES = {
  dragon: { nombre: "Dragón", huevo: "Verde",   favorito: "aji",       paleta: { piel: "#7ed36a", panza: "#dcf5c0", oscuro: "#4e9e3d", detalle: "#ffd35a" } },
  gato:   { nombre: "Gato",   huevo: "Naranja", favorito: "pescado",   paleta: { piel: "#f4b97f", panza: "#fdebd7", oscuro: "#c98a52", detalle: "#ffb6c1" } },
  perro:  { nombre: "Perro",  huevo: "Café",    favorito: "pollo",     paleta: { piel: "#c99a6b", panza: "#f2e2cc", oscuro: "#8a6340", detalle: "#3b2b22" } },
  conejo: { nombre: "Conejo", huevo: "Rosado",  favorito: "zanahoria", paleta: { piel: "#f3eef8", panza: "#ffffff", oscuro: "#cfc5dd", detalle: "#ffb6c1", borde: "#d9cfe6" } },
  panda:  { nombre: "Panda",  huevo: "Blanco",  favorito: "bambu",     paleta: { piel: "#fbfbfb", panza: "#ffffff", oscuro: "#2b2b2b", detalle: "#2b2b2b", borde: "#dcdcdc" } },
  zorro:  { nombre: "Zorro",  huevo: "Rojizo",  favorito: "arandanos", paleta: { piel: "#f28c4a", panza: "#fff3e6", oscuro: "#c25f22", detalle: "#ffffff" } },
};

const ORDEN_ESPECIES = ["dragon", "gato", "perro", "conejo", "panda", "zorro"];

/* ---------- Comidas ----------
   tipo: fruta, verdura, proteina, lacteo, cereal o dulce.
   Las sanas son fruta, verdura, proteina y lacteo.
   Los dulces dan mucho ánimo pero bajan la salud; el segundo dulce del día hace daño.
   "estacion" hace que la comida solo aparezca en esa época del año. */
const ALIMENTOS = [
  { id: "manzana",   nombre: "Manzana",         emoji: "🍎", tipo: "fruta",    comida: 20, salud: 4,  animo: 2 },
  { id: "platano",   nombre: "Plátano",         emoji: "🍌", tipo: "fruta",    comida: 22, salud: 3,  animo: 3 },
  { id: "arandanos", nombre: "Arándanos",       emoji: "🫐", tipo: "fruta",    comida: 15, salud: 5,  animo: 3 },
  { id: "sandia",    nombre: "Sandía",          emoji: "🍉", tipo: "fruta",    comida: 18, salud: 4,  animo: 6, estacion: "verano" },
  { id: "zanahoria", nombre: "Zanahoria",       emoji: "🥕", tipo: "verdura",  comida: 18, salud: 6,  animo: 0 },
  { id: "brocoli",   nombre: "Brócoli",         emoji: "🥦", tipo: "verdura",  comida: 18, salud: 7,  animo: -2 },
  { id: "bambu",     nombre: "Bambú",           emoji: "🎋", tipo: "verdura",  comida: 20, salud: 5,  animo: 1 },
  { id: "aji",       nombre: "Ají",             emoji: "🌶️", tipo: "verdura",  comida: 10, salud: 2,  animo: 2 },
  { id: "sopa",      nombre: "Sopa calientita", emoji: "🍲", tipo: "verdura",  comida: 28, salud: 6,  animo: 5, estacion: "invierno" },
  { id: "pollo",     nombre: "Pollo",           emoji: "🍗", tipo: "proteina", comida: 30, salud: 3,  animo: 3 },
  { id: "pescado",   nombre: "Pescado",         emoji: "🐟", tipo: "proteina", comida: 28, salud: 4,  animo: 2 },
  { id: "leche",     nombre: "Leche",           emoji: "🥛", tipo: "lacteo",   comida: 12, salud: 4,  animo: 2 },
  { id: "pan",       nombre: "Pan",             emoji: "🍞", tipo: "cereal",   comida: 25, salud: 1,  animo: 2 },
  { id: "galleta",   nombre: "Galleta",         emoji: "🍪", tipo: "dulce",    comida: 12, salud: -2, animo: 8 },
  { id: "pastel",    nombre: "Pastel",          emoji: "🍰", tipo: "dulce",    comida: 20, salud: -4, animo: 10 },
  { id: "helado",    nombre: "Helado",          emoji: "🍦", tipo: "dulce",    comida: 12, salud: -3, animo: 12, estacion: "verano" },
];

const TIPOS_SANOS = ["fruta", "verdura", "proteina", "lacteo"];

/* ---------- Ropa ----------
   zona: cabeza, ojos, cuello o cuerpo (solo una prenda por zona).
   abrigo: sirve para el invierno. sol: sirve para el verano.
   logro: se desbloquea con ese logro en vez de comprarse. */
const ROPA = [
  { id: "gorro-lana",    nombre: "Gorro de lana",     emoji: "🧶", zona: "cabeza", precio: 20, abrigo: true },
  { id: "gorra",         nombre: "Gorra",             emoji: "🧢", zona: "cabeza", precio: 15, sol: true },
  { id: "paja",          nombre: "Sombrero de paja",  emoji: "👒", zona: "cabeza", precio: 25, sol: true },
  { id: "fiesta",        nombre: "Gorro de fiesta",   emoji: "🥳", zona: "cabeza", precio: 10 },
  { id: "flor",          nombre: "Flor",              emoji: "🌸", zona: "cabeza", precio: 10 },
  { id: "corona",        nombre: "Corona",            emoji: "👑", zona: "cabeza", precio: 0, logro: "adulto" },
  { id: "lentes-sol",    nombre: "Lentes de sol",     emoji: "🕶️", zona: "ojos",   precio: 20, sol: true },
  { id: "lentes",        nombre: "Lentes redondos",   emoji: "👓", zona: "ojos",   precio: 15 },
  { id: "antifaz",       nombre: "Antifaz de héroe",  emoji: "🦸", zona: "ojos",   precio: 0, logro: "campeon" },
  { id: "bufanda",       nombre: "Bufanda",           emoji: "🧣", zona: "cuello", precio: 20, abrigo: true },
  { id: "panuelo",       nombre: "Pañuelo",           emoji: "🔷", zona: "cuello", precio: 10 },
  { id: "corbatin",      nombre: "Corbatín",          emoji: "🎀", zona: "cuello", precio: 15 },
  { id: "collar-flores", nombre: "Collar de flores",  emoji: "🌺", zona: "cuello", precio: 25 },
  { id: "polera",        nombre: "Polera",            emoji: "👕", zona: "cuerpo", precio: 15 },
  { id: "chaleco",       nombre: "Chaleco de lana",   emoji: "🧥", zona: "cuerpo", precio: 30, abrigo: true },
  { id: "impermeable",   nombre: "Impermeable",       emoji: "🌧️", zona: "cuerpo", precio: 25 },
  { id: "vestido",       nombre: "Vestido",           emoji: "👗", zona: "cuerpo", precio: 25 },
  { id: "capa",          nombre: "Capa de héroe",     emoji: "🦸", zona: "cuerpo", precio: 0, logro: "racha7" },
];

const ZONAS_ROPA = [
  { id: "cabeza", nombre: "Cabeza", emoji: "🎩" },
  { id: "ojos",   nombre: "Ojos",   emoji: "👀" },
  { id: "cuello", nombre: "Cuello", emoji: "🧣" },
  { id: "cuerpo", nombre: "Cuerpo", emoji: "👕" },
];

/* ---------- Logros (medallas) ---------- */
const LOGROS = [
  { id: "nacer",         nombre: "¡Nació!",           emoji: "🐣", pista: "Haz que salga del huevo",                     monedas: 10 },
  { id: "primera-comida",nombre: "Primer bocado",     emoji: "🍎", pista: "Dale de comer por primera vez",               monedas: 5 },
  { id: "gourmet",       nombre: "Gourmet",           emoji: "👨‍🍳", pista: "Prueba 8 comidas distintas",                  monedas: 20 },
  { id: "sano",          nombre: "Come sano",         emoji: "🥗", pista: "Da 20 comidas saludables",                     monedas: 20 },
  { id: "dormilon",      nombre: "Dormilón",          emoji: "😴", pista: "Duerme 10 veces",                              monedas: 15 },
  { id: "limpito",       nombre: "Limpito",           emoji: "🛁", pista: "Da 10 baños",                                  monedas: 15 },
  { id: "deportista",    nombre: "Deportista",        emoji: "🏃", pista: "Juega 10 minijuegos",                          monedas: 20 },
  { id: "campeon",       nombre: "Campeón",           emoji: "🏆", pista: "Gana un juego en modo difícil",                monedas: 30 },
  { id: "constructor",   nombre: "Constructor",       emoji: "🧱", pista: "Borra 5 filas en Bloques",                     monedas: 15 },
  { id: "memoria-pro",   nombre: "Gran memoria",      emoji: "🧠", pista: "Termina Memoria casi sin fallar",              monedas: 15 },
  { id: "matematico",    nombre: "Matemático",        emoji: "🔢", pista: "Responde 10 de 10 en Números",                 monedas: 20 },
  { id: "oido-fino",     nombre: "Oído fino",         emoji: "🎵", pista: "Llega a 8 en Secuencia",                       monedas: 20 },
  { id: "cocinero",      nombre: "Canasta llena",     emoji: "🧺", pista: "Atrapa 20 comidas en Canasta",                 monedas: 15 },
  { id: "racha3",        nombre: "Responsable",       emoji: "📅", pista: "Cumple las tareas 3 días seguidos",            monedas: 30 },
  { id: "racha7",        nombre: "Súper responsable", emoji: "🌟", pista: "Cumple las tareas 7 días seguidos",            monedas: 60 },
  { id: "racha30",       nombre: "Un mes cuidando",   emoji: "🏅", pista: "Cumple las tareas 30 días seguidos",           monedas: 150 },
  { id: "nivel5",        nombre: "Nivel 5",           emoji: "⭐", pista: "Llega al nivel 5",                             monedas: 20 },
  { id: "nivel10",       nombre: "Nivel 10",          emoji: "🌠", pista: "Llega al nivel 10",                            monedas: 40 },
  { id: "adulto",        nombre: "Todo un adulto",    emoji: "🦁", pista: "Evoluciona hasta adulto (regala una corona)", monedas: 50 },
  { id: "moda",          nombre: "A la moda",         emoji: "👗", pista: "Ponle 3 prendas a la vez",                     monedas: 15 },
  { id: "coleccionista", nombre: "Coleccionista",     emoji: "🧥", pista: "Consigue 8 prendas",                           monedas: 30 },
  { id: "abrigado",      nombre: "Abrigadito",        emoji: "🧣", pista: "Abrígalo en invierno",                         monedas: 10 },
  { id: "veraneante",    nombre: "Veraneante",        emoji: "🕶️", pista: "Protégelo del sol en verano",                  monedas: 10 },
  { id: "amigos",        nombre: "Amigos",            emoji: "🤝", pista: "Recibe la visita de un amigo",                 monedas: 20 },
  { id: "popular",       nombre: "Popular",           emoji: "🎉", pista: "Recibe 5 amigos distintos",                    monedas: 40 },
  { id: "familia",       nombre: "Familia grande",    emoji: "🏠", pista: "Cuida 2 mascotas o más",                       monedas: 20 },
  { id: "recuperado",    nombre: "Sanito otra vez",   emoji: "💪", pista: "Cúralo después de estar enfermo",              monedas: 15 },
];

/* ---------- Estaciones (hemisferio sur, como en Chile) ---------- */
const ESTACIONES = {
  verano:    { nombre: "Verano",    emoji: "☀️", meses: [11, 0, 1], particula: "☀️", consejo: "Hace calor: ponle gorra, sombrero o lentes de sol." },
  otono:     { nombre: "Otoño",     emoji: "🍂", meses: [2, 3, 4],  particula: "🍂", consejo: "Caen las hojas. ¡Buen momento para jugar!" },
  invierno:  { nombre: "Invierno",  emoji: "❄️", meses: [5, 6, 7],  particula: "❄️", consejo: "Hace frío: abrígalo con gorro, bufanda o chaleco." },
  primavera: { nombre: "Primavera", emoji: "🌸", meses: [8, 9, 10], particula: "🌸", consejo: "Todo florece. ¡Sal a jugar!" },
};

function estacionDeFecha(fecha = new Date()) {
  const mes = fecha.getMonth();
  for (const id in ESTACIONES) {
    if (ESTACIONES[id].meses.includes(mes)) return id;
  }
  return "primavera";
}

/* ---------- Minijuegos ---------- */
const MINIJUEGOS = [
  { id: "pelota",    nombre: "Atrapa la pelota", emoji: "⚽", ayuda: "Toca la pelota antes de que se escape" },
  { id: "canasta",   nombre: "Canasta",          emoji: "🧺", ayuda: "Atrapa la comida rica y esquiva lo malo" },
  { id: "bloques",   nombre: "Bloques",          emoji: "🧱", ayuda: "Completa filas para borrarlas" },
  { id: "memoria",   nombre: "Memoria",          emoji: "🃏", ayuda: "Encuentra las parejas" },
  { id: "secuencia", nombre: "Secuencia",        emoji: "🎵", ayuda: "Repite los colores en orden" },
  { id: "numeros",   nombre: "Números",          emoji: "🔢", ayuda: "Resuelve las cuentas antes que se acabe el tiempo" },
];

const DIFICULTADES = [
  { nombre: "Fácil",   emoji: "😊", mult: 1 },
  { nombre: "Normal",  emoji: "🙂", mult: 1.5 },
  { nombre: "Difícil", emoji: "😎", mult: 2 },
];
