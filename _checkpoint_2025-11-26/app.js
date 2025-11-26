// Copia de seguridad de app.js (2025-11-26)
// --- Inicio ---

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
  const selectPedido = $('#select-persona-pedido');
  const selectModal = $('#pedido-persona');
  const sets = [selectPedido, selectModal];
  sets.forEach(sel => {
    sel.innerHTML = '<option value="">Todas</option>';
    personas.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nombre;
      sel.appendChild(opt);
    });
  });
}

function refreshProductoOptions() {
  const productos = Storage.productos.all().filter(p => p.activo);
  const select = $('#pedido-producto');
  if (!select) return;
  select.innerHTML = '<option value="">(Opcional) Selecciona para autocompletar</option>';
  productos.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.nombre} (${formatCurrency(p.precio)})`;
    select.appendChild(opt);
  });
}

// Responsables (rotación)
function renderRotacion() {
  const rot = Storage.rotaciones.current();
  const tbody = $('#tabla-rotacion tbody');
  tbody.innerHTML = '';
  const personas = Storage.personas.all();
  if (!rot) return;
  rot.asignaciones.forEach(asg => {
    const persona = personas.find(p => p.id === asg.personaId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${asg.dia}</td>
      <td>${persona ? persona.nombre : '<span class="muted">Sin asignar</span>'}</td>
      <td class="right"><button class="secondary" data-cambiar="${asg.dia}">Cambiar</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('button[data-cambiar]').forEach(btn => btn.onclick = () => cambiarResponsable(btn.dataset.cambiar));

  const histBody = $('#tabla-historial tbody');
  histBody.innerHTML = '';
  Storage.rotaciones.history().forEach(r => {
    const f = new Date(r.fechaISO);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${f.toLocaleDateString()}</td><td>${r.asignaciones.map(a => a.dia).join(', ')}</td>`;
    histBody.appendChild(tr);
  });
}

function cambiarResponsable(dia) {
  const personas = Storage.personas.all().filter(p => p.activo);
  const nombre = prompt(`Nuevo responsable para ${dia}:\n` + personas.map(p => p.nombre).join(', '));
  if (!nombre) return;
  const persona = personas.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
  if (!persona) return alert('No encontrado');
  const rot = Storage.rotaciones.current();
  const asignaciones = rot.asignaciones.map(a => a.dia === dia ? { ...a, personaId: persona.id } : a);
  const nuevas = [{ ...rot, asignaciones }, ...Storage.rotaciones.history()];
  localStorage.setItem(Storage.KEYS.rotaciones, JSON.stringify(nuevas));
  renderRotacion();
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
  const personaSel = $('#select-persona-pedido').value;
  const pmin = Number($('#precio-min').value) || 0;
  const pmax = Number($('#precio-max').value) || Number.MAX_SAFE_INTEGER;
  const personas = Storage.personas.all();
  const list = Storage.pedidos.all()
    .filter(p => !personaSel || p.personaId === personaSel)
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
      <td>${persona ? persona.nombre : '-'}</td>
      <td>${item.descripcion}</td>
      <td class="right">${item.cantidad}</td>
      <td class="right">${formatCurrency(item.precio)}</td>
      <td class="right">${formatCurrency(total)}</td>
      <td class="right">
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

function openPedidoModal(id = null) {
  const modal = $('#modal-pedido');
  const title = $('#titulo-modal-pedido');
  const productoSel = $('#pedido-producto');
  const personaSel = $('#pedido-persona');
  const desc = $('#pedido-descripcion');
  const cant = $('#pedido-cantidad');
  const precio = $('#pedido-precio');

  title.textContent = id ? 'Editar Pedido' : 'Agregar Pedido';
  refreshPersonaOptions();
  refreshProductoOptions();

  if (id) {
    const p = Storage.pedidos.all().find(x => x.id === id);
    productoSel.value = '';
    personaSel.value = p?.personaId || '';
    desc.value = p?.descripcion || '';
    cant.value = p?.cantidad ?? 1;
    precio.value = p?.precio ?? 0;
  } else {
    productoSel.value = '';
    personaSel.value = '';
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
  $('#precio-min').oninput = renderPedidos;
  $('#precio-max').oninput = renderPedidos;
  $('#select-persona-pedido').onchange = renderPedidos;
  const buscarSelectPersona = document.querySelector('#buscar-select-persona');
  if (buscarSelectPersona) buscarSelectPersona.oninput = () => filterSelect(document.querySelector('#select-persona-pedido'), buscarSelectPersona.value);
  $('#btn-cancel-pedido').onclick = () => { $('#modal-pedido').close(); };
  $('#pedido-producto').onchange = () => {
    const id = $('#pedido-producto').value;
    if (!id) return;
    const prod = Storage.productos.all().find(p => p.id === id);
    if (!prod) return;
    $('#pedido-descripcion').value = prod.descripcion || prod.nombre;
    $('#pedido-precio').value = prod.precio || 0;
  };
  const buscarPersonaModal = document.querySelector('#buscar-select-persona-modal');
  if (buscarPersonaModal) buscarPersonaModal.oninput = () => filterSelect(document.querySelector('#pedido-persona'), buscarPersonaModal.value);
  const buscarProductoModal = document.querySelector('#buscar-select-producto');
  if (buscarProductoModal) buscarProductoModal.oninput = () => filterSelect(document.querySelector('#pedido-producto'), buscarProductoModal.value);
  $('#form-pedido').onsubmit = (e) => {
    e.preventDefault();
    const id = $('#modal-pedido').dataset.id || null;
    const personaId = $('#pedido-persona').value || '';
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

document.addEventListener('DOMContentLoaded', init);

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
      <td>${p.nombre}</td>
      <td>${p.descripcion || '-'}</td>
      <td class="right">${formatCurrency(p.precio)}</td>
      <td><span class="badge ${p.activo ? 'active' : 'inactive'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td class="right">
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
  btnImport.onclick = () => fileInput.click();
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

// --- Fin ---
