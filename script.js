/* ============================================================
   CRONOS-VALOR 2030 · script.js
   Simulador Econométrico INPC México 1970-2030
   ============================================================ */

'use strict';

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

const TASA_PROYECCION = 0.045;
const ANIO_MAX_REAL   = 2024;
const ANIO_MIN        = 1970;
const ANIO_MAX        = 2030;

function getINPC(anio) {
  if (anio <= ANIO_MAX_REAL) {
    return interpolarINPC(anio);
  }
  const inpc2024 = interpolarINPC(ANIO_MAX_REAL);
  const n        = anio - ANIO_MAX_REAL;
  return inpc2024 * Math.pow(1 + TASA_PROYECCION, n);
}

function interpolarINPC(anio) {
  for (let i = 0; i < DB_INPC.length - 1; i++) {
    const p1 = DB_INPC[i];
    const p2 = DB_INPC[i + 1];
    if (anio >= p1.anio && anio <= p2.anio) {
      const t = (anio - p1.anio) / (p2.anio - p1.anio);
      return p1.inpc + t * (p2.inpc - p1.inpc);
    }
  }
  if (anio <= DB_INPC[0].anio) return DB_INPC[0].inpc;
  if (anio >= DB_INPC[DB_INPC.length - 1].anio) return DB_INPC[DB_INPC.length - 1].inpc;
}

function formatMXN(n, esReconversion = false) {
  let moneda = new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 4
  }).format(n);
  return esReconversion ? moneda + " (Nuevos Pesos)" : moneda;
}

function setError(msg) {
  const el = document.getElementById('error-msg');
  if (msg) {
    el.textContent = '⚠ ' + msg;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

// Event Listeners para automatizar el Switch si cruzan el año 1993
document.getElementById('anio-origen').addEventListener('input', evaluarCruceReforma);
document.getElementById('anio-destino').addEventListener('input', evaluarCruceReforma);

function evaluarCruceReforma() {
    const origen = parseInt(document.getElementById('anio-origen').value, 10);
    const destino = parseInt(document.getElementById('anio-destino').value, 10);
    const toggle = document.getElementById('toggle-ceros');
    
    if (origen < 1993 && destino >= 1993) {
        toggle.checked = true; // Activa el switch automáticamente
    }
}

function calcular() {
  setError(null);

  const montoRaw   = document.getElementById('monto').value.trim();
  const origenRaw  = document.getElementById('anio-origen').value.trim();
  const destinoRaw = document.getElementById('anio-destino').value.trim();
  const toggleCeros = document.getElementById('toggle-ceros').checked; // Lee el estado del switch

  if (!montoRaw || !origenRaw || !destinoRaw) {
    setError('Todos los campos son obligatorios. Por favor, complétalos.');
    return;
  }

  const monto   = parseFloat(montoRaw);
  const origen  = parseInt(origenRaw, 10);
  const destino = parseInt(destinoRaw, 10);

  if (isNaN(monto) || monto <= 0) {
    setError('El monto debe ser un valor positivo mayor a cero.');
    return;
  }

  if (isNaN(origen) || origen < ANIO_MIN || origen > ANIO_MAX) {
    setError(`El año de origen debe estar entre ${ANIO_MIN} y ${ANIO_MAX}.`);
    return;
  }
  if (isNaN(destino) || destino < ANIO_MIN || destino > ANIO_MAX) {
    setError(`El año destino debe estar entre ${ANIO_MIN} y ${ANIO_MAX}.`);
    return;
  }

  let montoAjustado = monto;

  /* Lógica vinculada al Switch Manual */
  if (toggleCeros) {
    montoAjustado = montoAjustado / 1000;
  }

  const inpcOrigen  = getINPC(origen);
  const inpcDestino = getINPC(destino);
  const factor      = inpcDestino / inpcOrigen;
  const valorFinal  = montoAjustado * factor;
  const infAcum     = ((factor - 1) * 100).toFixed(2);

  document.getElementById('res-original').textContent  = formatMXN(monto);
  document.getElementById('res-final').textContent     = formatMXN(valorFinal, toggleCeros);
  document.getElementById('res-inflacion').textContent = `${infAcum}%`;
  
  const spanReforma = document.getElementById('res-reforma');
  if (toggleCeros) {
      spanReforma.innerHTML = '✔ Activa <span style="color: var(--neon2);">(-3 ceros)</span>';
  } else {
      spanReforma.textContent = '— Inactiva';
  }

  const nota = document.getElementById('nota-proyeccion');
  if (destino > ANIO_MAX_REAL) {
    nota.classList.remove('hidden');
  } else {
    nota.classList.add('hidden');
  }

  dibujarGrafica(origen, destino);
}

let chartInstance = null;

function dibujarGrafica(origenDestacado, destinoDestacado) {
  const labels = [];
  const datos  = [];
  for (let y = 1970; y <= 2030; y += 2) {
    labels.push(y.toString());
    datos.push(parseFloat(getINPC(y).toFixed(4)));
  }

  const ctx = document.getElementById('grafica').getContext('2d');

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

function llenarTabla() {
  const tbody = document.getElementById('tabla-body');
  tbody.innerHTML = '';

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

document.addEventListener('DOMContentLoaded', () => {
  llenarTabla();
  dibujarGrafica(1970, 2024);
});
