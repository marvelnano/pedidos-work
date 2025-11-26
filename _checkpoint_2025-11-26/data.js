// Copia de seguridad de data.js (2025-11-26)
// --- Inicio ---

// data.js
// Persistencia sencilla usando localStorage con claves por sección.

const Storage = (() => {
	const KEYS = {
		personas: 'pedidos_personas',
		rotaciones: 'pedidos_rotaciones',
		pedidos: 'pedidos_items',
		productos: 'pedidos_productos'
	};

	const read = (key) => {
		try {
			const raw = localStorage.getItem(key);
			return raw ? JSON.parse(raw) : [];
		} catch (e) {
			console.error('Storage read error', e);
			return [];
		}
	};

	const write = (key, value) => {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch (e) {
			console.error('Storage write error', e);
		}
	};

	const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

	// Personas CRUD
	const personas = {
		all: () => read(KEYS.personas),
		add: (nombre, activo = true) => {
			const list = read(KEYS.personas);
			const item = { id: uid(), nombre: nombre.trim(), activo: !!activo };
			list.push(item);
			write(KEYS.personas, list);
			return item;
		},
		update: (id, data) => {
			const list = read(KEYS.personas).map(p => p.id === id ? { ...p, ...data } : p);
			write(KEYS.personas, list);
		},
		remove: (id) => {
			const list = read(KEYS.personas).filter(p => p.id !== id);
			write(KEYS.personas, list);
		}
	};

	// Rotaciones por semana (lunes a viernes)
	const rotaciones = {
		current: () => read(KEYS.rotaciones)[0] || null,
		history: () => read(KEYS.rotaciones).slice(1),
		rotateWeek: (personasActivas) => {
			const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
			const fecha = new Date();
			const weekId = uid();
			const asignaciones = dias.map((dia, i) => ({
				dia,
				personaId: personasActivas.length ? personasActivas[i % personasActivas.length].id : null
			}));
			const rotacion = { id: weekId, fechaISO: fecha.toISOString(), asignaciones };
			const list = read(KEYS.rotaciones);
			list.unshift(rotacion);
			write(KEYS.rotaciones, list);
			return rotacion;
		},
		clear: () => { write(KEYS.rotaciones, []); }
	};

	// Productos frecuentes CRUD
	const productos = {
		all: () => read(KEYS.productos),
		add: (nombre, descripcion, precio, activo = true) => {
			const list = read(KEYS.productos);
			const item = { id: uid(), nombre: nombre.trim(), descripcion: (descripcion||'').trim(), precio: Number(precio)||0, activo: !!activo };
			list.push(item);
			write(KEYS.productos, list);
			return item;
		},
		update: (id, data) => {
			const list = read(KEYS.productos).map(p => p.id === id ? { ...p, ...data } : p);
			write(KEYS.productos, list);
		},
		remove: (id) => {
			const list = read(KEYS.productos).filter(p => p.id !== id);
			write(KEYS.productos, list);
		}
	};

	// Pedidos CRUD
	const pedidos = {
		all: () => read(KEYS.pedidos),
		add: (personaId, descripcion, cantidad, precio) => {
			const list = read(KEYS.pedidos);
			const item = {
				id: uid(), personaId, descripcion: descripcion.trim(),
				cantidad: Number(cantidad) || 0, precio: Number(precio) || 0
			};
			list.push(item);
			write(KEYS.pedidos, list);
			return item;
		},
		update: (id, data) => {
			const list = read(KEYS.pedidos).map(p => p.id === id ? { ...p, ...data } : p);
			write(KEYS.pedidos, list);
		},
		remove: (id) => {
			const list = read(KEYS.pedidos).filter(p => p.id !== id);
			write(KEYS.pedidos, list);
		}
	};

	// Snapshots (export/import)
	const dump = () => ({
		personas: read(KEYS.personas),
		rotaciones: read(KEYS.rotaciones),
		productos: read(KEYS.productos),
		pedidos: read(KEYS.pedidos)
	});

	const loadSnapshot = (snapshot) => {
		if (!snapshot || typeof snapshot !== 'object') throw new Error('Snapshot inválido');
		const { personas: ps = [], rotaciones: rs = [], productos: prods = [], pedidos: its = [] } = snapshot;
		if (!Array.isArray(ps) || !Array.isArray(rs) || !Array.isArray(prods) || !Array.isArray(its)) throw new Error('Formato inválido');
		write(KEYS.personas, ps);
		write(KEYS.rotaciones, rs);
		write(KEYS.productos, prods);
		write(KEYS.pedidos, its);
	};

	return { KEYS, personas, rotaciones, productos, pedidos, dump, loadSnapshot };
})();

