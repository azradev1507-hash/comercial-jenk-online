// Selector de dirección con mapa (Leaflet + OpenStreetMap). Deja latitud y longitud en los inputs
// ocultos #latitude y #longitude, y propone el texto de la dirección en #address (editable).
// Leaflet se carga por <script> en la página: aquí se usa window.L.
import { setError } from '../utils/forms.js';

const CENTRO = [10.2469, -67.5958];   // Maracay
const ZOOM_INICIAL = 13;
const ZOOM_PUNTO = 17;
const LIMITES = { lat: [0.6, 12.4], lng: [-73.5, -59.7] }; // caja aproximada de Venezuela
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const redondear = (n) => Math.round(n * 1e6) / 1e6;

async function pedirJson(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export function initMapPicker(root) {
  const $ = (sel) => root.querySelector(sel);
  const mapaEl = $('[data-mapa]');
  const busqueda = $('[data-mapa-busqueda]');
  const btnBuscar = $('[data-mapa-buscar]');
  const btnUbicar = $('[data-mapa-ubicar]');
  const estado = $('[data-mapa-estado]');
  const lista = $('[data-mapa-resultados]');
  const lat = $('#latitude');
  const lng = $('#longitude');
  const direccion = $('#address');
  const L = window.L;

  const aviso = (texto, error = false) => { estado.textContent = texto; estado.classList.toggle('is-error', error); };

  if (!L) {
    mapaEl.hidden = true;
    [busqueda, btnBuscar, btnUbicar].forEach((el) => { el.disabled = true; });
    aviso('No pudimos cargar el mapa. Revisa tu conexión y recarga la página.', true);
    return;
  }

  const mapa = L.map(mapaEl, { scrollWheelZoom: false }).setView(CENTRO, ZOOM_INICIAL);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa);

  const icono = L.divIcon({ className: 'pin-icono', html: '<span class="pin"></span>', iconSize: [30, 30], iconAnchor: [15, 36] });
  let marcador = null;
  let direccionEditada = false;
  let turno = 0; // descarta respuestas viejas del geocodificador

  direccion.addEventListener('input', () => { direccionEditada = direccion.value.trim() !== ''; });

  function proponerDireccion(texto) {
    if (direccionEditada) return;
    direccion.value = texto;
    setError(direccion, '');
  }

  async function direccionDe(punto) {
    const mio = ++turno;
    aviso('Buscando la dirección de este punto…');
    try {
      const d = await pedirJson(`${NOMINATIM}/reverse?format=jsonv2&zoom=18&accept-language=es&lat=${punto.lat}&lon=${punto.lng}`);
      if (mio !== turno) return;
      if (d.display_name) proponerDireccion(d.display_name);
      aviso('Ubicación marcada. Puedes arrastrar el marcador para afinarla.');
    } catch {
      if (mio !== turno) return;
      aviso('Ubicación marcada, pero no pudimos obtener el texto de la dirección. Escríbela abajo.');
    }
  }

  // Coloca (o mueve) el marcador y guarda las coordenadas
  function colocar(punto, { zoom, texto } = {}) {
    const p = { lat: redondear(punto.lat), lng: redondear(punto.lng) };
    if (!marcador) {
      marcador = L.marker([p.lat, p.lng], { draggable: true, icon: icono, keyboard: true, title: 'Tu ubicación' }).addTo(mapa);
      marcador.on('dragend', () => { const q = marcador.getLatLng(); colocar({ lat: q.lat, lng: q.lng }); });
    } else {
      marcador.setLatLng([p.lat, p.lng]);
    }
    lat.value = p.lat;
    lng.value = p.lng;
    setError(lat, '');
    if (zoom) mapa.setView([p.lat, p.lng], zoom);
    if (texto) { proponerDireccion(texto); aviso('Ubicación marcada. Puedes arrastrar el marcador para afinarla.'); }
    else direccionDe(p);
  }

  mapa.on('click', (e) => colocar(e.latlng));

  // ----- Búsqueda por texto -----
  async function buscar() {
    const q = busqueda.value.trim();
    lista.replaceChildren();
    lista.hidden = true;
    if (q.length < 3) return aviso('Escribe al menos 3 letras para buscar.', true);
    btnBuscar.disabled = true;
    aviso('Buscando…');
    try {
      const url = `${NOMINATIM}/search?format=jsonv2&limit=5&countrycodes=ve&accept-language=es&viewbox=-68.3,10.6,-67.0,9.8&q=${encodeURIComponent(q)}`;
      const res = await pedirJson(url);
      if (!res.length) return aviso('No encontramos ese lugar. Prueba con otro nombre o toca el mapa.', true);
      aviso('Elige el resultado correcto:');
      lista.append(...res.map((r) => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = r.display_name;
        b.addEventListener('click', () => {
          lista.hidden = true;
          colocar({ lat: Number(r.lat), lng: Number(r.lon) }, { zoom: ZOOM_PUNTO, texto: r.display_name });
        });
        li.append(b);
        return li;
      }));
      lista.hidden = false;
    } catch {
      aviso('No pudimos buscar ahora. Toca el mapa para marcar tu ubicación.', true);
    } finally {
      btnBuscar.disabled = false;
    }
  }
  btnBuscar.addEventListener('click', buscar);
  busqueda.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } });

  // ----- Mi ubicación -----
  btnUbicar.addEventListener('click', () => {
    if (!navigator.geolocation) return aviso('Tu navegador no permite obtener la ubicación. Búscala o toca el mapa.', true);
    aviso('Obteniendo tu ubicación…');
    navigator.geolocation.getCurrentPosition(
      (pos) => colocar({ lat: pos.coords.latitude, lng: pos.coords.longitude }, { zoom: ZOOM_PUNTO }),
      () => aviso('No pudimos obtener tu ubicación. Revisa el permiso del navegador o toca el mapa.', true),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

  return { limites: LIMITES };
}

export const dentroDeVenezuela = (la, lo) =>
  la >= LIMITES.lat[0] && la <= LIMITES.lat[1] && lo >= LIMITES.lng[0] && lo <= LIMITES.lng[1];
