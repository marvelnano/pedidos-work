const API_URL = '/api';

const state = {
  personas: [],
  productos: [],
  pedidos: [],
  rotaciones: []
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? response.json() : null;
}

function toUiPersona(row) {
  return { id: row.id, nombre: row.nombre, activo: Number(row.estado) === 1 };
}

function toUiProducto(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion || '',
    precio: Number(row.precio || 0),
    activo: Number(row.estado) === 1
  };
}

function toUiPedido(row) {
  return {
    id: row.id,
    personaId: row.persona_id || row.personaId,
    descripcion: row.descripcion,
    cantidad: Number(row.cantidad || 1),
    precio: Number(row.precio || 0)
  };
}

function toUiRotacion(row) {
  return {
    id: row.id,
    fechaISO: row.fechaISO || row.fecha_iso,
    excluidos: Array.isArray(row.excluidos) ? row.excluidos : [],
    asignaciones: (row.asignaciones || []).map(a => ({ dia: a.dia, personaId: a.personaId ?? a.persona_id ?? null }))
  };
}

async function refreshAll() {
  const [personasRows, productosRows, pedidosRows, rotacionActual, rotacionesHistorial] = await Promise.all([
    api('/personas'),
    api('/productos'),
    api('/pedidos'),
    api('/rotaciones/current'),
    api('/rotaciones/history')
  ]);

  state.personas = personasRows.map(toUiPersona);
  state.productos = productosRows.map(toUiProducto);
  state.pedidos = pedidosRows.map(toUiPedido);
  const actual = rotacionActual ? [toUiRotacion(rotacionActual)] : [];
  const history = (rotacionesHistorial || []).map(toUiRotacion);
  state.rotaciones = [...actual, ...history];
}

async function refreshPersonasOnly() {
  const personasRows = await api('/personas');
  state.personas = personasRows.map(toUiPersona);
}

async function refreshProductosOnly() {
  const productosRows = await api('/productos');
  state.productos = productosRows.map(toUiProducto);
}

async function refreshPedidosOnly() {
  const pedidosRows = await api('/pedidos');
  state.pedidos = pedidosRows.map(toUiPedido);
}

async function refreshRotacionesOnly() {
  const [rotacionActual, rotacionesHistorial] = await Promise.all([
    api('/rotaciones/current'),
    api('/rotaciones/history')
  ]);
  const actual = rotacionActual ? [toUiRotacion(rotacionActual)] : [];
  const history = (rotacionesHistorial || []).map(toUiRotacion);
  state.rotaciones = [...actual, ...history];
}

const Storage = {
  init: async () => {
    try {
      await refreshAll();
    } catch (error) {
      console.error('No se pudo cargar la API al iniciar:', error);
      state.personas = [];
      state.productos = [];
      state.pedidos = [];
      state.rotaciones = [];
    }
  },

  refresh: async () => {
    try {
      await refreshAll();
      return true;
    } catch (error) {
      console.error('No se pudo refrescar la data desde API:', error);
      return false;
    }
  },

  refreshByTab: async (tab) => {
    try {
      if (tab === 'personas') {
        await refreshPersonasOnly();
        return true;
      }
      if (tab === 'responsables') {
        await Promise.all([refreshPersonasOnly(), refreshRotacionesOnly()]);
        return true;
      }
      if (tab === 'productos') {
        await refreshProductosOnly();
        return true;
      }
      if (tab === 'pedidos') {
        await Promise.all([refreshPedidosOnly(), refreshPersonasOnly(), refreshProductosOnly()]);
        return true;
      }
      await refreshAll();
      return true;
    } catch (error) {
      console.error('No se pudo refrescar la data por pestaña:', error);
      return false;
    }
  },

  personas: {
    all: () => state.personas,
    add: (nombre, activo = true) => {
      const item = { id: uid(), nombre: nombre.trim(), activo: !!activo };
      state.personas.push(item);
      void api('/personas', {
        method: 'POST',
        body: JSON.stringify({ id: item.id, nombre: item.nombre, estado: item.activo ? 1 : 0 })
      });
      return item;
    },
    update: (id, data) => {
      state.personas = state.personas.map(p => p.id === id ? { ...p, ...data } : p);
      const updated = state.personas.find(p => p.id === id);
      if (!updated) return;
      void api(`/personas/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nombre: updated.nombre, estado: updated.activo ? 1 : 0 })
      });
    },
    remove: (id) => {
      state.personas = state.personas.map(p => p.id === id ? { ...p, activo: false } : p);
      void api(`/personas/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: 0 })
      });
    }
  },

  productos: {
    all: () => state.productos,
    add: (nombre, descripcion, precio, activo = true) => {
      const item = {
        id: uid(),
        nombre: nombre.trim(),
        descripcion: (descripcion || '').trim(),
        precio: Number(precio) || 0,
        activo: !!activo
      };
      state.productos.push(item);
      void api('/productos', {
        method: 'POST',
        body: JSON.stringify({ ...item, estado: item.activo ? 1 : 0 })
      });
      return item;
    },
    update: (id, data) => {
      state.productos = state.productos.map(p => p.id === id ? { ...p, ...data } : p);
      const updated = state.productos.find(p => p.id === id);
      if (!updated) return;
      void api(`/productos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: updated.nombre,
          descripcion: updated.descripcion,
          precio: updated.precio,
          estado: updated.activo ? 1 : 0
        })
      });
    },
    remove: (id) => {
      state.productos = state.productos.map(p => p.id === id ? { ...p, activo: false } : p);
      void api(`/productos/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: 0 })
      });
    }
  },

  pedidos: {
    all: () => state.pedidos,
    add: (personaId, descripcion, cantidad, precio) => {
      const item = {
        id: uid(),
        personaId,
        descripcion: descripcion.trim(),
        cantidad: Number(cantidad) || 1,
        precio: Number(precio) || 0
      };
      state.pedidos.push(item);
      void api('/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          id: item.id,
          persona_id: item.personaId,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precio: item.precio,
          estado: 1
        })
      });
      return item;
    },
    update: (id, data) => {
      state.pedidos = state.pedidos.map(p => p.id === id ? { ...p, ...data } : p);
      const updated = state.pedidos.find(p => p.id === id);
      if (!updated) return;
      void api(`/pedidos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          persona_id: updated.personaId,
          descripcion: updated.descripcion,
          cantidad: updated.cantidad,
          precio: updated.precio,
          estado: 1
        })
      });
    },
    remove: (id) => {
      state.pedidos = state.pedidos.filter(p => p.id !== id);
      void api(`/pedidos/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: 0 })
      });
    }
  },

  rotaciones: {
    current: () => state.rotaciones[0] || null,
    history: () => state.rotaciones.slice(1),
    rotateWeek: (personasActivas) => {
      const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      const rotActual = state.rotaciones[0] || null;
      const excluidos = Array.isArray(rotActual?.excluidos) ? rotActual.excluidos : [];
      const candidatos = personasActivas.filter(p => !excluidos.includes(p.id));
      const ids = candidatos.map(p => p.id);

      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }

      const rotacion = {
        id: uid(),
        fechaISO: new Date().toISOString(),
        excluidos: [],
        asignaciones: dias.map((dia, i) => ({ dia, personaId: ids.length ? ids[i % ids.length] : null }))
      };

      state.rotaciones.unshift(rotacion);
      void api('/rotaciones/rotate', { method: 'POST', body: JSON.stringify(rotacion) });
      return rotacion;
    },
    updateDia: (dia, personaId) => {
      const current = state.rotaciones[0];
      if (!current) return;

      const asignacion = current.asignaciones.find(a => a.dia === dia);
      if (!asignacion) return;

      if (personaId === null && asignacion.personaId && !current.excluidos.includes(asignacion.personaId)) {
        current.excluidos.push(asignacion.personaId);
      }

      asignacion.personaId = personaId;
      void api('/rotaciones/current/dia', {
        method: 'PATCH',
        body: JSON.stringify({ dia, personaId })
      });
    },
    setCurrent: (rotacion) => {
      if (!rotacion) return;
      state.rotaciones = [rotacion, ...state.rotaciones.slice(1)];
    },
    clear: () => {
      state.rotaciones = [];
      void api('/rotaciones/clear', { method: 'DELETE' });
    }
  },

  dump: () => ({
    personas: state.personas,
    productos: state.productos,
    pedidos: state.pedidos,
    rotaciones: state.rotaciones
  }),

  loadSnapshot: (snapshot) => {
    if (!snapshot || typeof snapshot !== 'object') throw new Error('Snapshot inválido');
    if (!Array.isArray(snapshot.personas) || !Array.isArray(snapshot.productos) || !Array.isArray(snapshot.pedidos) || !Array.isArray(snapshot.rotaciones)) {
      throw new Error('Formato inválido');
    }

    state.personas = snapshot.personas.map(p => ({ id: p.id, nombre: p.nombre, activo: p.activo ?? Number(p.estado) === 1 }));
    state.productos = snapshot.productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio: Number(p.precio || 0),
      activo: p.activo ?? Number(p.estado) === 1
    }));
    state.pedidos = snapshot.pedidos.map(p => ({
      id: p.id,
      personaId: p.personaId || p.persona_id,
      descripcion: p.descripcion,
      cantidad: Number(p.cantidad || 1),
      precio: Number(p.precio || 0)
    }));
    state.rotaciones = snapshot.rotaciones.map(toUiRotacion);

    void api('/snapshot/replace', {
      method: 'POST',
      body: JSON.stringify(snapshot)
    });
  }
};
