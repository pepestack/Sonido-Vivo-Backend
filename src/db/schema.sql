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
