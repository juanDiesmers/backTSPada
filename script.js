// script.js

// Paleta de colores para capas y algoritmos
const COLORS = {
  mesh:    '#4a5568',
  points:  '#d69e2e',
  brute:   '#e53e3e',
  nearest: '#38a169',
  genetic: '#3182ce'
};

// Endpoints
const API_BASE    = 'http://localhost:5000/api/network';
const POINTS_BASE = 'http://localhost:5000/api/points';

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar mapa
  const map = L.map('map').setView([4.60971, -74.08175], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Capas
  const roadLayer      = L.geoJSON(null, {
    filter: f => f.geometry.type === 'LineString',
    style: () => ({ color: COLORS.mesh, weight: 2 })
  }).addTo(map);
  const pointsLayer    = L.layerGroup().addTo(map);
  const algorithmLayer = L.layerGroup().addTo(map);

  // Toggle capas
  document.getElementById('toggle-mesh').onchange = e =>
    e.target.checked ? map.addLayer(roadLayer) : map.removeLayer(roadLayer);
  document.getElementById('toggle-points').onchange = e =>
    e.target.checked ? map.addLayer(pointsLayer) : map.removeLayer(pointsLayer);
  document.getElementById('toggle-algo').onchange = e =>
    e.target.checked ? map.addLayer(algorithmLayer) : map.removeLayer(algorithmLayer);

  // Subir OSM
  document.getElementById('btn-upload-osm').onclick = async () => {
    const file = document.getElementById('file-osm').files[0];
    if (!file) return alert('Selecciona un archivo .osm');
    const form = new FormData(); form.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/upload-osm`, { method:'POST', body: form });
      if (!res.ok) throw new Error(res.statusText);
      const geo = await res.json();
      roadLayer.clearLayers().addData(geo);
      map.fitBounds(roadLayer.getBounds());
    } catch (err) {
      console.error(err);
      alert('Error cargando malla: ' + err.message);
    }
  };

  // Subir TSV
  document.getElementById('btn-upload-points').onclick = async () => {
    const file = document.getElementById('file-points').files[0];
    if (!file) return alert('Selecciona un archivo .tsv');
    const form = new FormData(); form.append('file', file);
    try {
      const res = await fetch(`${POINTS_BASE}/upload-points`, { method:'POST', body: form });
      if (!res.ok) throw new Error(res.statusText);
      const { points } = await res.json();
      pointsLayer.clearLayers();
      points.forEach(pt => {
        L.circleMarker([pt.lat, pt.lng], {
          radius:6,
          color: COLORS.points,
          fillColor: COLORS.points,
          fillOpacity:0.8,
          weight:1
        }).bindPopup(`ID: ${pt.id}`).addTo(pointsLayer);
      });
    } catch (err) {
      console.error(err);
      alert('Error cargando puntos: ' + err.message);
    }
  };

  // Función genérica TSP
  async function runTSP(type) {
  if (!roadLayer.getLayers().length || !pointsLayer.getLayers().length) {
    return alert('Carga primero la malla y los puntos.');
  }
  algorithmLayer.clearLayers();
  try {
    const res = await fetch(`${API_BASE}/tsp?type=${type}`);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    console.log('Respuesta TSP:', data);

    // Extraemos el campo time que manda el back
    const { path, distance, time } = data;

    // Pintamos la ruta
    L.polyline(path, { color: COLORS[type], weight: 4 })
      .addTo(algorithmLayer);

    // Y mostramos en la tabla
    addResult(type, distance, time);
  } catch (err) {
    console.error(err);
    alert('Error ejecutando ' + type + ': ' + err.message);
  }
}

  // Botones de algoritmo
  document.querySelectorAll('.btn-algo').forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.type;
      if (type === 'run-all') {
        ['brute','nearest','genetic'].forEach(runTSP);
      } else {
        runTSP(type);
      }
    };
  });
  // Añadir resultado a la tabla
  function addResult(type, dist, time) {
  const tbody = document.getElementById('results-body');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="color:${COLORS[type]};font-weight:bold">${type}</td>
    <td>${dist.toFixed(2)}</td>
    <td>${time}</td>
  `;
  tbody.appendChild(tr);
}

  // Limpiar resultados y mapa
  document.getElementById('btn-clear-results').onclick = () =>
    document.getElementById('results-body').innerHTML = '';
  document.getElementById('btn-clear-map').onclick = () =>
    algorithmLayer.clearLayers();
});
