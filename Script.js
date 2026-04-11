/* ============================================================
   CRONOS-VALOR 2030 · script.js
   Simulador Econométrico INPC México 1970-2030
   ============================================================ */

'use strict';

/* ── BASE DE DATOS INPC (Índice Nacional de Precios al Consumidor) ──
   Fuente: BANXICO / INEGI
   * Los valores anteriores a 1993 están en pesos "viejos" (antes de la
     Reforma Monetaria de 1993 que dividió entre 1,000).
   * A partir de 1993 los valores están en "nuevos pesos".
   ─────────────────────────────────────────────────────────────── */
const DB_INPC = [
  { anio: 1970, inpc:   0.0172, nota: 'Base histórica'   },
  { anio: 1975, inpc:   0.0348, nota: ''                  },
  { anio: 1980, inpc:   0.1028, nota: 'Crisis petrolera'  },
  { anio: 1985, inpc:   0.4551, nota: 'Hiperinflación'    },
  { anio: 1988, inpc:   2.4748, nota: 'Crisis cambiaria'  },
  { anio: 1990, inpc:   4.6156, nota: ''                  },
  { anio: 1992, inpc:   7.8175, nota: ''                  },
  { anio: 1993, inpc:   9.3366, nota: 'Reforma monetaria' },
  { anio: 1994, inpc:   9.9752, nota: 'Error de diciembre'},
  { anio: 1995, inpc:  13.3610, nota: 'Devaluación'       },
  { anio: 2000, inpc:  20.1896, nota: ''                  },
  { anio: 2005, inpc:  26.3065, nota: ''                  },
  { anio: 2010, inpc:  33.4050, nota: ''                  },
  { anio: 2015, inpc:  42.1840, nota: ''                  },
  { anio: 2018, inpc:  49.5530, nota: ''                  },
  { anio: 2020, inpc:  53.0100, nota: 'Pandemia COVID-19' },
  { anio: 2022, inpc:  62.3740, nota: 'Inflación global'  },
  { anio: 2023, inpc:  68.1070, nota: ''                  },
  { anio: 2024, inpc:  73.0600, nota: 'Último dato real'  },
];

/* Tasa de proyección para 2025-2030 */
const TASA_PROYECCION = 0.045;
const ANIO_MAX_REAL   = 2024;
const ANIO_MIN        = 1970;
const ANIO_MAX        = 2030;

/* ── UTILIDADES ── */

/** Devuelve el INPC interpolado para un año dado (real o proyectado). */
function getINPC(anio) {
  if (anio <= ANIO_MAX_REAL) {
    return interpolarINPC(anio);
  }
  /* Proyección con interés compuesto desde 2024 */
  const inpc2024 = interpolarINPC(ANIO_MAX_REAL);
  const n        = anio - ANIO_MAX_REAL;
  return inpc2024 * Math.pow(1 + TASA_PROYECCION, n);
}

/** Interpolación lineal entre los puntos de la base de datos. */
function interpolarINPC(anio) {
  /* Búsqueda del intervalo exacto */
  for (let i = 0; i < DB_INPC.length - 1; i++) {
    const p1 = DB_INPC[i];
    const p2 = DB_INPC[i + 1];
    if (anio >= p1.anio && anio <= p2.anio) {
      const t = (anio - p1.anio) / (p2.anio - p1.anio);
      return p1.inpc + t * (p2.inpc - p1.inpc);
    }
  }
  /* Fuera del rango: devuelve extremos */
  if (anio <= DB_INPC[0].anio)                  return DB_INPC[0].inpc;
  if (anio >= DB_INPC[DB_INPC.length - 1].anio) return DB_INPC[DB_INPC.length - 1].inpc;
}

/** Decide si se aplica la reforma monetaria (origen < 1993, destino >= 1993). */
function aplicaReforma(origen, destino) {
  return origen < 1993 && destino >= 1993;
}

/** Formatea número a moneda MXN. */
function formatMXN(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 4
  }).format(n);
}

/** Muestra u oculta el mensaje de error. */
function setError(msg) {
  const el = document.getElementById('error-msg');
  if (msg) {
    el.textContent = '⚠ ' + msg;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

/* ── LÓGICA PRINCIPAL ── */
function calcular() {
  setError(null);

  /* Leer entradas */
  const montoRaw   = document.getElementById('monto').value.trim();
  const origenRaw  = document.getElementById('anio-origen').value.trim();
  const destinoRaw = document.getElementById('anio-destino').value.trim();

  /* Validar nulos */
  if (!montoRaw || !origenRaw || !destinoRaw) {
    setError('Todos los campos son obligatorios. Por favor, complétalos.');
    return;
  }

  const monto   = parseFloat(montoRaw);
  const origen  = parseInt(origenRaw, 10);
  const destino = parseInt(destinoRaw, 10);

  /* Validar negativos / cero */
  if (isNaN(monto) || monto <= 0) {
    setError('El monto debe ser un valor positivo mayor a cero.');
    return;
  }

  /* Validar rango de años */
  if (isNaN(origen) || origen < ANIO_MIN || origen > ANIO_MAX) {
    setError(`El año de origen debe estar entre ${ANIO_MIN} y ${ANIO_MAX}.`);
    return;
  }
  if (isNaN(destino) || destino < ANIO_MIN || destino > ANIO_MAX) {
    setError(`El año destino debe estar entre ${ANIO_MIN} y ${ANIO_MAX}.`);
    return;
  }

  /* ── CÁLCULO ── */
  let montoAjustado = monto;
  let reformaAplicada = false;

  /* Reforma monetaria de 1993 */
  if (aplicaReforma(origen, destino)) {
    montoAjustado   = montoAjustado / 1000;
    reformaAplicada = true;
  }

  const inpcOrigen  = getINPC(origen);
  const inpcDestino = getINPC(destino);
  const factor      = inpcDestino / inpcOrigen;
  const valorFinal  = montoAjustado * factor;
  const infAcum     = ((factor - 1) * 100).toFixed(2);

  /* Mostrar resultados */
  document.getElementById('res-original').textContent  = formatMXN(monto);
  document.getElementById('res-final').textContent     = formatMXN(valorFinal);
  document.getElementById('res-inflacion').textContent = `${infAcum}%`;
  document.getElementById('res-reforma').textContent   = reformaAplicada
    ? '✔ Dividido ÷ 1,000' : '— No aplicó';

  /* Nota proyección */
  const nota = document.getElementById('nota-proyeccion');
  if (destino > ANIO_MAX_REAL) {
    nota.classList.remove('hidden');
  } else {
    nota.classList.add('hidden');
  }

  /* Actualizar gráfica con rango del cálculo */
  dibujarGrafica(origen, destino);
}

/* ── GRÁFICA ── */
let chartInstance = null;

function dibujarGrafica(origenDestacado, destinoDestacado) {
  /* Generar puntos: años cada 2 desde 1970 hasta 2030 */
  const labels = [];
  const datos  = [];
  for (let y = 1970; y <= 2030; y += 2) {
    labels.push(y.toString());
    datos.push(parseFloat(getINPC(y).toFixed(4)));
  }

  const ctx = document.getElementById('grafica').getContext('2d');

  /* Destruir instancia anterior para evitar overlap */
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'INPC Real',
          data: datos.filter((_, i) => parseInt(labels[i]) <= ANIO_MAX_REAL),
          fill: true,
          backgroundColor: 'rgba(0,229,255,0.07)',
          borderColor: '#00e5ff',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#00e5ff',
          pointBorderColor: '#050c14',
          tension: 0.4,
        },
        {
          label: 'Proyección 4.5%',
          data: datos.map((v, i) => parseInt(labels[i]) >= ANIO_MAX_REAL ? v : null),
          fill: true,
          backgroundColor: 'rgba(240,165,0,0.07)',
          borderColor: '#f0a500',
          borderWidth: 2,
          borderDash: [6, 3],
          pointRadius: 3,
          pointBackgroundColor: '#f0a500',
          pointBorderColor: '#050c14',
          tension: 0.4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: {
            color: '#5a7a9a',
            font: { family: "'Share Tech Mono', monospace", size: 11 },
            boxWidth: 16,
          }
        },
        tooltip: {
          backgroundColor: '#0d1a2d',
          borderColor: '#1a3050',
          borderWidth: 1,
          titleColor: '#00e5ff',
          bodyColor: '#c8ddf0',
          titleFont: { family: "'Share Tech Mono', monospace" },
          bodyFont:  { family: "'Share Tech Mono', monospace" },
        }
      },
      scales: {
        x: {
          ticks: { color: '#5a7a9a', font: { family: "'Share Tech Mono', monospace", size: 10 }, maxTicksLimit: 16 },
          grid:  { color: 'rgba(26,48,80,0.5)' }
        },
        y: {
          ticks: { color: '#5a7a9a', font: { family: "'Share Tech Mono', monospace", size: 10 } },
          grid:  { color: 'rgba(26,48,80,0.5)' },
          title: { display: true, text: 'INPC', color: '#5a7a9a', font: { family: "'Share Tech Mono', monospace", size: 11 } }
        }
      }
    }
  });
}

/* ── TABLA INPC ── */
function llenarTabla() {
  const tbody = document.getElementById('tabla-body');
  tbody.innerHTML = '';

  /* Combinar datos reales + proyecciones anuales de 2025-2030 */
  const filas = [...DB_INPC];
  for (let y = 2025; y <= 2030; y++) {
    filas.push({ anio: y, inpc: getINPC(y), nota: 'Proyección' });
  }

  filas.forEach((row, idx) => {
    const anterior = idx > 0 ? filas[idx - 1].inpc : null;
    const infAnual = anterior
      ? (((row.inpc - anterior) / anterior) * 100).toFixed(2) + '%'
      : '—';

    let notaHTML = '';
    if (row.nota === 'Reforma monetaria') {
      notaHTML = `<span class="tag-reforma">Reforma 1993</span>`;
    } else if (row.nota === 'Proyección') {
      notaHTML = `<span class="tag-proyeccion">Proyección</span>`;
    } else {
      notaHTML = row.nota || '—';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.anio}</td>
      <td>${row.inpc.toFixed(4)}</td>
      <td>${infAnual}</td>
      <td>${notaHTML}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ── INICIO ── */
document.addEventListener('DOMContentLoaded', () => {
  llenarTabla();
  dibujarGrafica(1970, 2024);
});
