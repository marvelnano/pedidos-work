// app.js
// UI y lógica de la app

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function formatCurrency(n) {
  return (Number(n) || 0).toLocaleString('es-ES', { style: 'currency', currency: 'PEN' });
}

// Toasts simples
function showToast(message, type = 'info', timeout = 2500) {
  const container = document.querySelector('#toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => { el.remove(); }, timeout);
}

function switchTab(tab) {
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab));
}

function initTabs() {
  $$('.tab').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
}

// Personas
function renderPersonas() {
  const buscar = $('#input-buscar-persona').value.toLowerCase();
  const list = Storage.personas.all().filter(p => p.nombre.toLowerCase().includes(buscar));
  const tbody = $('#tabla-personas tbody');
  tbody.innerHTML = '';
  list.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.nombre}</td>
      <td><span class="badge ${p.activo ? 'active' : 'inactive'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td class="right">
        <button class="secondary" data-edit="${p.id}">Editar</button>
        <button class="danger" data-del="${p.id}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Acciones
  tbody.querySelectorAll('button[data-edit]').forEach(btn => btn.onclick = () => openPersonaModal(btn.dataset.edit));
  tbody.querySelectorAll('button[data-del]').forEach(btn => btn.onclick = () => {
    Storage.personas.remove(btn.dataset.del);
    renderPersonas();
    refreshPersonaOptions();
    renderPedidos();
  });
}

function openPersonaModal(id = null) {
  const modal = $('#modal-persona');
  const title = $('#titulo-modal-persona');
  const nombre = $('#persona-nombre');
  const activo = $('#persona-activo');
  title.textContent = id ? 'Editar Persona' : 'Agregar Persona';
  if (id) {
    const p = Storage.personas.all().find(x => x.id === id);
    nombre.value = p?.nombre || '';
    activo.checked = !!p?.activo;
  } else {
    nombre.value = '';
    activo.checked = true;
  }
  modal.dataset.id = id || '';
  modal.showModal();
}

function initPersonas() {
  $('#btn-add-persona').onclick = () => openPersonaModal();
  $('#input-buscar-persona').oninput = renderPersonas;
  $('#btn-cancel-persona').onclick = () => { $('#modal-persona').close(); };
  $('#form-persona').onsubmit = (e) => {
    e.preventDefault();
    const id = $('#modal-persona').dataset.id || null;
    const nombre = $('#persona-nombre').value.trim();
    const activo = $('#persona-activo').checked;
    if (!nombre) return;
    if (id) Storage.personas.update(id, { nombre, activo });
    else Storage.personas.add(nombre, activo);
    $('#modal-persona').close();
    renderPersonas();
    refreshPersonaOptions();
    showToast(id ? 'Persona actualizada' : 'Persona agregada', 'success');
  };
}

function refreshPersonaOptions() {
  const personas = Storage.personas.all().filter(p => p.activo);
  const dlPedidos = $('#datalist-personas');
  const dlModal = $('#datalist-personas-modal');
  if (dlPedidos) dlPedidos.innerHTML = '';
  if (dlModal) dlModal.innerHTML = '';
  personas.forEach(p => {
    const opt1 = document.createElement('option'); opt1.value = p.nombre; opt1.dataset.id = p.id;
    const opt2 = document.createElement('option'); opt2.value = p.nombre; opt2.dataset.id = p.id;
    if (dlPedidos) dlPedidos.appendChild(opt1);
    if (dlModal) dlModal.appendChild(opt2);
  });
}

function refreshProductoOptions() {
  const productos = Storage.productos.all().filter(p => p.activo);
  const dl = $('#datalist-productos');
  if (!dl) return;
  dl.innerHTML = '';
  productos.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.nombre; // mostrará nombre y permite búsqueda
    opt.label = `${p.nombre} (${formatCurrency(p.precio)})`;
    opt.dataset.id = p.id;
    opt.dataset.precio = p.precio;
    opt.dataset.descripcion = p.descripcion || '';
    dl.appendChild(opt);
  });
}

// Responsables (rotación)
function renderRotacion() {
  const rot = Storage.rotaciones.current();
  const tbody = $('#tabla-rotacion tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!rot) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = 'Sin rotación generada. Usa "Rotar semana".';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  const personas = Storage.personas.all();
  rot.asignaciones.forEach(asig => {
    const persona = personas.find(p => p.id === asig.personaId);
    const tr = document.createElement('tr');
    const tdDia = document.createElement('td');
    tdDia.textContent = asig.dia;
    const tdPersona = document.createElement('td');
    tdPersona.textContent = persona ? persona.nombre : '-';
    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'right';
    tdAcciones.innerHTML = `
      <button class="secondary" data-edit-dia="${asig.dia}">Editar</button>
      <button class="secondary" data-next-dia="${asig.dia}">Siguiente</button>
      <button class="danger" data-clear-dia="${asig.dia}">Vaciar</button>
    `;
    tr.appendChild(tdDia);
    tr.appendChild(tdPersona);
    tr.appendChild(tdAcciones);
    tbody.appendChild(tr);
  });

  // Handlers de acciones
  tbody.querySelectorAll('button[data-clear-dia]').forEach(btn => {
    btn.onclick = () => { Storage.rotaciones.updateDia(btn.dataset.clearDia, null); renderRotacion(); showToast('Día vaciado', 'info'); };
  });
  tbody.querySelectorAll('button[data-next-dia]').forEach(btn => {
    btn.onclick = () => {
      const dia = btn.dataset.nextDia;
      const rot = Storage.rotaciones.current();
      const personasActivas = Storage.personas.all().filter(p => p.activo);
      if (!rot || !personasActivas.length) return;
      const actual = rot.asignaciones.find(a => a.dia === dia)?.personaId;
      const idx = Math.max(0, personasActivas.findIndex(p => p.id === actual));
      const siguiente = personasActivas[(idx + 1) % personasActivas.length].id;
      Storage.rotaciones.updateDia(dia, siguiente);
      renderRotacion();
      showToast('Día reasignado al siguiente', 'success');
    };
  });
  tbody.querySelectorAll('button[data-edit-dia]').forEach(btn => {
    btn.onclick = () => {
      const dia = btn.dataset.editDia;
      const modal = $('#modal-responsable');
      const titulo = $('#titulo-modal-responsable');
      const input = $('#responsable-persona-input');
      const personas = Storage.personas.all();
      const rot = Storage.rotaciones.current();
      const actualId = rot?.asignaciones?.find(a => a.dia === dia)?.personaId;
      const actualNombre = personas.find(p => p.id === actualId)?.nombre || '';
      refreshPersonaOptions();
      titulo.textContent = `Editar Responsable - ${dia}`;
      $('#responsable-dia').value = dia;
      input.value = actualNombre;
      modal.showModal();
    };
  });

  // Modal responsable handlers
  $('#btn-cancel-responsable').onclick = () => { $('#modal-responsable').close(); };
  $('#form-responsable').onsubmit = (e) => {
    e.preventDefault();
    const dia = $('#responsable-dia').value;
    const nombre = $('#responsable-persona-input').value.trim();
    const id = findPersonaIdByNombre(nombre);
    if (!id) { showToast('Persona no encontrada', 'error'); return; }
    Storage.rotaciones.updateDia(dia, id);
    $('#modal-responsable').close();
    renderRotacion();
    showToast('Responsable actualizado', 'success');
  };
}

function initResponsables() {
  $('#btn-rotar-responsables').onclick = () => {
    const personasActivas = Storage.personas.all().filter(p => p.activo);
    Storage.rotaciones.rotateWeek(personasActivas);
    renderRotacion();
  };
  $('#btn-limpiar-rotacion').onclick = () => { Storage.rotaciones.clear(); renderRotacion(); };
}

// Pedidos
function renderPedidos() {
  const buscar = $('#input-buscar-pedido').value.toLowerCase();
  const personaInput = $('#persona-pedidos-input')?.value || '';
  const personaSelId = findPersonaIdByNombre(personaInput);
  const pmin = Number($('#precio-min')?.value) || 0;
  const pmax = Number($('#precio-max')?.value) || Number.MAX_SAFE_INTEGER;
  const personas = Storage.personas.all();
  const list = Storage.pedidos.all()
    .filter(p => !personaSelId || p.personaId === personaSelId)
    .filter(p => p.descripcion.toLowerCase().includes(buscar))
    .filter(p => p.precio >= pmin && p.precio <= pmax);

  const tbody = $('#tabla-pedidos tbody');
  tbody.innerHTML = '';
  let totalGeneral = 0;
  list.forEach(item => {
    const persona = personas.find(x => x.id === item.personaId);
    const total = (item.cantidad || 0) * (item.precio || 0);
    totalGeneral += total;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Persona">${persona ? persona.nombre : '-'}</td>
      <td data-label="Descripción">${item.descripcion}</td>
      <td class="right" data-label="Cantidad">${item.cantidad}</td>
      <td class="right" data-label="Precio">${formatCurrency(item.precio)}</td>
      <td class="right" data-label="Total">${formatCurrency(total)}</td>
      <td class="right" data-label="Acciones">
        <button class="secondary" data-edit-p="${item.id}">Editar</button>
        <button class="danger" data-del-p="${item.id}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  $('#total-general').textContent = formatCurrency(totalGeneral);

  tbody.querySelectorAll('button[data-edit-p]').forEach(btn => btn.onclick = () => openPedidoModal(btn.dataset.editP));
  tbody.querySelectorAll('button[data-del-p]').forEach(btn => btn.onclick = () => { Storage.pedidos.remove(btn.dataset.delP); renderPedidos(); renderSubtotales(); showToast('Pedido eliminado', 'info'); });
}

// Subtotales por persona (respeta filtros actuales)
function renderSubtotales() {
  const tbody = $('#tabla-subtotales tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const personas = Storage.personas.all();
  const buscar = ($('#input-buscar-pedido')?.value || '').toLowerCase();
  const personaInput = $('#persona-pedidos-input')?.value || '';
  const personaSelId = findPersonaIdByNombre(personaInput);
  const pmin = Number($('#precio-min')?.value) || 0;
  const pmax = Number($('#precio-max')?.value) || Number.MAX_SAFE_INTEGER;
  const visibles = Storage.pedidos.all()
    .filter(p => !personaSelId || p.personaId === personaSelId)
    .filter(p => (p.descripcion || '').toLowerCase().includes(buscar))
    .filter(p => (Number(p.precio) || 0) >= pmin && (Number(p.precio) || 0) <= pmax);

  const mapa = new Map();
  personas.forEach(p => mapa.set(p.id, { nombre: p.nombre, total: 0 }));
  visibles.forEach(ped => {
    const entry = mapa.get(ped.personaId);
    if (!entry) return;
    const cantidad = Number(ped.cantidad) || 0;
    const precio = Number(ped.precio) || 0;
    entry.total += cantidad * precio;
  });
  const rows = Array.from(mapa.values())
    .filter(v => v.total > 0)
    .map(v => {
      const tr = document.createElement('tr');
      const tdNombre = document.createElement('td');
      tdNombre.textContent = v.nombre;
      const tdTotal = document.createElement('td');
      tdTotal.textContent = formatCurrency(v.total);
      tr.appendChild(tdNombre);
      tr.appendChild(tdTotal);
      return tr;
    });
  if (rows.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = 'Sin datos';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    rows.forEach(r => tbody.appendChild(r));
  }
}

function openPedidoModal(id = null) {
  const modal = $('#modal-pedido');
  const title = $('#titulo-modal-pedido');
  const productoInput = $('#pedido-producto-input');
  const personaInput = $('#pedido-persona-input');
  const desc = $('#pedido-descripcion');
  const cant = $('#pedido-cantidad');
  const precio = $('#pedido-precio');
  const personas = Storage.personas.all();

  title.textContent = id ? 'Editar Pedido' : 'Agregar Pedido';
  refreshPersonaOptions();
  refreshProductoOptions();

  if (id) {
    const p = Storage.pedidos.all().find(x => x.id === id);
    productoInput.value = '';
    personaInput.value = personas.find(x => x.id === p?.personaId)?.nombre || '';
    desc.value = p?.descripcion || '';
    cant.value = p?.cantidad ?? 1;
    precio.value = p?.precio ?? 0;
  } else {
    productoInput.value = '';
    personaInput.value = '';
    desc.value = '';
    cant.value = 1;
    precio.value = 0;
  }
  modal.dataset.id = id || '';
  modal.showModal();
}

function initPedidos() {
  $('#btn-add-pedido').onclick = () => openPedidoModal();
  $('#input-buscar-pedido').oninput = renderPedidos;
  if ($('#precio-min')) $('#precio-min').oninput = renderPedidos;
  if ($('#precio-max')) $('#precio-max').oninput = renderPedidos;
  $('#persona-pedidos-input').oninput = renderPedidos;
  $('#btn-cancel-pedido').onclick = () => { $('#modal-pedido').close(); };
  $('#pedido-producto-input').oninput = () => {
    const nombreProd = $('#pedido-producto-input').value;
    const prod = findProductoByNombre(nombreProd);
    if (!prod) return;
    $('#pedido-descripcion').value = prod.descripcion || prod.nombre;
    $('#pedido-precio').value = prod.precio || 0;
  };
  $('#form-pedido').onsubmit = (e) => {
    e.preventDefault();
    const id = $('#modal-pedido').dataset.id || null;
    const personaNombre = $('#pedido-persona-input').value.trim();
    const personaId = findPersonaIdByNombre(personaNombre) || '';
    const descripcion = $('#pedido-descripcion').value.trim();
    const cantidad = Number($('#pedido-cantidad').value) || 0;
    const precio = Number($('#pedido-precio').value) || 0;
    if (!descripcion) return;
    if (id) Storage.pedidos.update(id, { personaId, descripcion, cantidad, precio });
    else Storage.pedidos.add(personaId, descripcion, cantidad, precio);
    $('#modal-pedido').close();
    renderPedidos();
    renderSubtotales();
    showToast(id ? 'Pedido actualizado' : 'Pedido agregado', 'success');
  };
}

function findPersonaIdByNombre(nombre) {
  if (!nombre) return '';
  const p = Storage.personas.all().find(x => x.nombre.toLowerCase() === nombre.toLowerCase());
  return p?.id || '';
}

function findProductoByNombre(nombre) {
  if (!nombre) return null;
  return Storage.productos.all().find(x => x.nombre.toLowerCase() === nombre.toLowerCase()) || null;
}

function init() {
  initTabs();
  initPersonas();
  initResponsables();
  initPedidos();
  initDataActions();
  initProductos();
  renderPersonas();
  renderRotacion();
  refreshPersonaOptions();
  renderPedidos();
  renderSubtotales();
  renderProductos();
  refreshProductoOptions();
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    init();
  } catch (e) {
    console.error('Error inicializando la app:', e);
    showToast('Ocurrió un error inicializando la app. Revisa la consola.', 'error', 4000);
  }
});

// Capturar errores no manejados para tener feedback en UI
window.addEventListener('error', (e) => {
  console.error('Uncaught error:', e.error || e.message);
  showToast('Error inesperado: ' + (e.error?.message || e.message || 'ver consola'), 'error', 4000);
});

// ===== Productos UI =====
function renderProductos() {
  const buscar = ($('#input-buscar-producto')?.value || '').toLowerCase();
  const pmin = Number($('#prod-precio-min')?.value) || 0;
  const pmax = Number($('#prod-precio-max')?.value) || Number.MAX_SAFE_INTEGER;
  const estado = $('#prod-estado')?.value || '';
  const list = Storage.productos.all()
    .filter(p => p.nombre.toLowerCase().includes(buscar) || (p.descripcion||'').toLowerCase().includes(buscar))
    .filter(p => p.precio >= pmin && p.precio <= pmax)
    .filter(p => estado === '' || (estado === 'activo' ? p.activo : !p.activo));

  const tbody = $('#tabla-productos tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  list.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Nombre">${p.nombre}</td>
      <td data-label="Descripción">${p.descripcion || '-'}</td>
      <td class="right" data-label="Precio">${formatCurrency(p.precio)}</td>
      <td data-label="Estado"><span class="badge ${p.activo ? 'active' : 'inactive'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td class="right" data-label="Acciones">
        <button class="secondary" data-edit-prod="${p.id}">Editar</button>
        <button class="danger" data-del-prod="${p.id}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('button[data-edit-prod]').forEach(btn => btn.onclick = () => openProductoModal(btn.dataset.editProd));
  tbody.querySelectorAll('button[data-del-prod]').forEach(btn => btn.onclick = () => { Storage.productos.remove(btn.dataset.delProd); renderProductos(); refreshProductoOptions(); showToast('Producto eliminado', 'info'); });
}

function openProductoModal(id = null) {
  const modal = $('#modal-producto');
  const title = $('#titulo-modal-producto');
  const nombre = $('#producto-nombre');
  const descripcion = $('#producto-descripcion');
  const precio = $('#producto-precio');
  const activo = $('#producto-activo');
  title.textContent = id ? 'Editar Producto' : 'Agregar Producto';
  if (id) {
    const p = Storage.productos.all().find(x => x.id === id);
    nombre.value = p?.nombre || '';
    descripcion.value = p?.descripcion || '';
    precio.value = p?.precio ?? 0;
    activo.checked = !!p?.activo;
  } else {
    nombre.value = '';
    descripcion.value = '';
    precio.value = 0;
    activo.checked = true;
  }
  modal.dataset.id = id || '';
  modal.showModal();
}

function initProductos() {
  $('#btn-add-producto').onclick = () => openProductoModal();
  $('#btn-cancel-producto').onclick = () => { $('#modal-producto').close(); };
  $('#input-buscar-producto').oninput = renderProductos;
  $('#prod-precio-min').oninput = renderProductos;
  $('#prod-precio-max').oninput = renderProductos;
  $('#prod-estado').onchange = renderProductos;
  $('#form-producto').onsubmit = (e) => {
    e.preventDefault();
    const id = $('#modal-producto').dataset.id || null;
    const nombre = $('#producto-nombre').value.trim();
    const descripcion = $('#producto-descripcion').value.trim();
    const precio = Number($('#producto-precio').value) || 0;
    const activo = $('#producto-activo').checked;
    if (!nombre) return;
    if (id) Storage.productos.update(id, { nombre, descripcion, precio, activo });
    else Storage.productos.add(nombre, descripcion, precio, activo);
    $('#modal-producto').close();
    renderProductos();
    refreshProductoOptions();
    showToast(id ? 'Producto actualizado' : 'Producto agregado', 'success');
  };
}

// (el hook de init ya no es necesario; Productos se inicializa en init)

// ===== Exportar / Importar / File System Access =====
function initDataActions() {
  const btnExport = $('#btn-exportar');
  const btnImport = $('#btn-importar');
  const fileInput = $('#file-import');
  const btnSaveFS = $('#btn-guardar-archivo');
  const btnOpenFS = $('#btn-abrir-archivo');

  btnExport.onclick = exportJSON;
  btnImport.onclick = async () => {
    try {
      if ('showOpenFilePicker' in window) {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
        });
        const file = await handle.getFile();
        const text = await file.text();
        const data = JSON.parse(text);
        Storage.loadSnapshot(data);
        renderPersonas();
        renderRotacion();
        refreshPersonaOptions();
        renderPedidos();
        renderSubtotales();
        renderProductos();
        refreshProductoOptions();
        showToast('Datos importados correctamente', 'success');
        return;
      }
    } catch (err) {
      console.error(err);
      showToast('No se pudo abrir el archivo', 'error');
      return;
    }
    // Fallback: crear input temporal para evitar restricciones de elementos ocultos
    try {
      const temp = document.createElement('input');
      temp.type = 'file';
      temp.accept = 'application/json,.json';
      temp.style.position = 'fixed';
      temp.style.left = '-9999px';
      document.body.appendChild(temp);
      temp.onchange = async (e2) => {
        try {
          const f = e2.target.files?.[0];
          if (!f) return;
          const text = await f.text();
          const data = JSON.parse(text);
          Storage.loadSnapshot(data);
          renderPersonas();
          renderRotacion();
          refreshPersonaOptions();
          renderPedidos();
          renderSubtotales();
          renderProductos();
          refreshProductoOptions();
          showToast('Datos importados correctamente', 'success');
        } catch (err2) {
          console.error(err2);
          showToast('Error importando JSON', 'error');
        } finally {
          temp.remove();
        }
      };
      temp.click();
    } catch (err3) {
      console.error(err3);
      showToast('No se pudo abrir el selector de archivos', 'error');
    }
  };
  fileInput.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      Storage.loadSnapshot(data);
      renderPersonas();
      renderRotacion();
      refreshPersonaOptions();
      renderPedidos();
      renderSubtotales();
      renderProductos();
      refreshProductoOptions();
      showToast('Datos importados correctamente', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error importando JSON', 'error');
    } finally {
      e.target.value = '';
    }
  };

  btnSaveFS.onclick = saveToFileFS;
  btnOpenFS.onclick = openFromFileFS;
}

function exportJSON() {
  const data = Storage.dump();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Exportado JSON', 'success');
}

let fileHandle = null;
async function saveToFileFS() {
  try {
    if (!('showSaveFilePicker' in window)) throw new Error('no-fs');
    if (!fileHandle) {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: 'pedidos.json',
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
      });
    }
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(Storage.dump(), null, 2));
    await writable.close();
    showToast('Guardado en archivo', 'success');
  } catch (e) {
    if (e.message === 'no-fs') {
      showToast('File System Access no disponible. Usa Exportar JSON o ejecuta en https/localhost (Chrome/Edge).', 'info', 4000);
    } else {
      console.error(e);
      showToast('No se pudo guardar el archivo', 'error');
    }
  }
}

async function openFromFileFS() {
  try {
    if (!('showOpenFilePicker' in window)) throw new Error('no-fs');
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
    });
    const file = await handle.getFile();
    const text = await file.text();
    const data = JSON.parse(text);
    Storage.loadSnapshot(data);
    fileHandle = handle; // para futuros guardados
    renderPersonas();
    renderRotacion();
    refreshPersonaOptions();
    renderPedidos();
    renderSubtotales();
    renderProductos();
    refreshProductoOptions();
    showToast('Archivo cargado', 'success');
  } catch (e) {
    if (e.message === 'no-fs') {
      showToast('File System Access no disponible. Usa Importar JSON o ejecuta en https/localhost (Chrome/Edge).', 'info', 4000);
    } else if (e.name !== 'AbortError') {
      console.error(e);
      showToast('No se pudo abrir el archivo', 'error');
    }
  }
}
