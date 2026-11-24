CREATE TABLE IF NOT EXISTS roles (
  id     SMALLSERIAL PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO roles (nombre)
VALUES ('Administrador'), ('Vendedor'), ('Cliente')
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS usuarios (
  id               SERIAL PRIMARY KEY,
  rut              VARCHAR(9)   NOT NULL UNIQUE,
  nombre           VARCHAR(50)  NOT NULL,
  apellido         VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE,
  correo           VARCHAR(100) NOT NULL UNIQUE,
  contrasena_hash  VARCHAR(100) NOT NULL,
  region           VARCHAR(100) NOT NULL,
  comuna           VARCHAR(100) NOT NULL,
  direccion        VARCHAR(300) NOT NULL,
  rol_id           SMALLINT     NOT NULL REFERENCES roles (id),
  activo           BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Migración: el caso Sonido Vivo solo define Administrador, Vendedor y Cliente.
-- En bases ya creadas, los usuarios con rol Cajero pasan a Vendedor y se elimina el rol.
UPDATE usuarios
SET rol_id = (SELECT id FROM roles WHERE nombre = 'Vendedor')
WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'Cajero');

DELETE FROM roles WHERE nombre = 'Cajero';

-- Categorías del catálogo, administrables desde el frontend.
-- Una categoría con productos no se borra: se desactiva con "activo".
CREATE TABLE IF NOT EXISTS categorias (
  id        SERIAL PRIMARY KEY,
  nombre    VARCHAR(50) NOT NULL UNIQUE,
  activo    BOOLEAN     NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categorias (nombre)
VALUES
  ('Guitarras Acústicas'), ('Guitarras Eléctricas'), ('Bajos Eléctricos'),
  ('Baterías'), ('Teclados y Pianos'), ('Amplificadores'), ('Micrófonos'),
  ('Pedales de Efectos'), ('Accesorios'), ('Estudio y Grabación')
ON CONFLICT (nombre) DO NOTHING;

-- Catálogo de productos. Precios en pesos chilenos (enteros, sin decimales).
-- "codigo" es el código del catálogo (ej. GA001). Datos iniciales en catalogo.sql.
CREATE TABLE IF NOT EXISTS productos (
  id             SERIAL PRIMARY KEY,
  codigo         VARCHAR(10)  NOT NULL UNIQUE,
  nombre         VARCHAR(100) NOT NULL,
  marca          VARCHAR(50)  NOT NULL,
  modelo         VARCHAR(50)  NOT NULL,
  descripcion    VARCHAR(500),
  categoria_id   INTEGER      NOT NULL REFERENCES categorias (id),
  precio         INTEGER      NOT NULL CHECK (precio >= 0),
  stock          INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
  imagen         VARCHAR(500),
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS productos_categoria_id_idx ON productos (categoria_id);

-- Pedidos de los clientes. El total se calcula en el servidor al crear el pedido.
CREATE TABLE IF NOT EXISTS pedidos (
  id             SERIAL PRIMARY KEY,
  usuario_id     INTEGER      NOT NULL REFERENCES usuarios (id),
  estado         VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado')),
  total          INTEGER      NOT NULL CHECK (total >= 0),
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pedidos_usuario_id_idx ON pedidos (usuario_id);

-- Detalle del pedido. precio_unitario guarda el precio al momento de comprar,
-- para que el pedido no cambie si después se modifica el precio del producto.
CREATE TABLE IF NOT EXISTS pedido_items (
  pedido_id       INTEGER NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
  producto_id     INTEGER NOT NULL REFERENCES productos (id),
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario INTEGER NOT NULL CHECK (precio_unitario >= 0),
  PRIMARY KEY (pedido_id, producto_id)
);

-- ===== KaijuApp (DSY1105) =====
-- Usuarios de KaijuApp, separados de los de Sonido Vivo (otros roles y otros datos).
CREATE TABLE IF NOT EXISTS kaiju_roles (
  id     SMALLSERIAL PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO kaiju_roles (nombre)
VALUES ('Administrador'), ('Encargado de inventario'), ('Vendedor')
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS kaiju_usuarios (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  correo          VARCHAR(100) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(100) NOT NULL,
  rol_id          SMALLINT     NOT NULL REFERENCES kaiju_roles (id),
  activo          BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
