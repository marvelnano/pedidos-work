-- db.sql: Esquema PostgreSQL para pedidos-work

CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS productos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL DEFAULT '',
    precio NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos (
    id TEXT PRIMARY KEY,
    persona_id TEXT NOT NULL REFERENCES personas(id),
    descripcion TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad >= 1),
    precio NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rotaciones (
    id TEXT PRIMARY KEY,
    fecha_iso TIMESTAMPTZ NOT NULL,
    excluidos JSONB NOT NULL DEFAULT '[]'::jsonb,
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rotacion_asignaciones (
    id BIGSERIAL PRIMARY KEY,
    rotacion_id TEXT NOT NULL REFERENCES rotaciones(id),
    dia TEXT NOT NULL,
    persona_id TEXT NULL REFERENCES personas(id),
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (rotacion_id, dia)
);

CREATE INDEX IF NOT EXISTS idx_personas_estado ON personas(estado);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_rotaciones_estado_fecha ON rotaciones(estado, fecha_iso DESC);
CREATE INDEX IF NOT EXISTS idx_rotacion_asignaciones_rotacion ON rotacion_asignaciones(rotacion_id);
