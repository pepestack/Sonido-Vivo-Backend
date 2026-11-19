const pool = require("../config/db");

const CAMPOS = `u.id, u.rut, u.nombre, u.apellido, u.fecha_nacimiento, u.correo,
                u.region, u.comuna, u.direccion, u.activo, u.creado_en, r.nombre AS rol`;

async function buscarPorCorreo(correo) {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.correo,
            u.contrasena_hash, u.activo, r.nombre AS rol
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.correo = $1`,
    [correo],
  );

  return rows[0] ?? null;
}

async function crear(datos, contrasenaHash, rol = "Cliente") {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (
       rut, nombre, apellido, fecha_nacimiento, correo,
       contrasena_hash, region, comuna, direccion, rol_id
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9,
       (SELECT id FROM roles WHERE nombre = $10)                
     )
     RETURNING id, nombre, apellido, correo`,
    [
      datos.rut,
      datos.nombre,
      datos.apellido,
      datos.fechaNacimiento || null,
      datos.correo,
      contrasenaHash,
      datos.region,
      datos.comuna,
      datos.direccion,
      rol,
    ],
  );

  return { ...rows[0], rol };
}

async function listar() {
  const { rows } = await pool.query(
    `SELECT ${CAMPOS} FROM usuarios u JOIN roles r ON r.id = u.rol_id ORDER BY u.id`,
  );
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    `SELECT ${CAMPOS} FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

async function actualizar(id, datos) {
  const { rowCount } = await pool.query(
    `UPDATE usuarios SET
       nombre = $2, apellido = $3, fecha_nacimiento = $4, correo = $5,
       region = $6, comuna = $7, direccion = $8,
       rol_id = (SELECT id FROM roles WHERE nombre = $9)
     WHERE id = $1`,
    [
      id,
      datos.nombre,
      datos.apellido,
      datos.fechaNacimiento || null,
      datos.correo,
      datos.region,
      datos.comuna,
      datos.direccion,
      datos.rol,
    ],
  );
  return rowCount > 0 ? buscarPorId(id) : null;
}

async function desactivar(id) {
  const { rowCount } = await pool.query(
    `UPDATE usuarios SET activo = FALSE WHERE id = $1 AND activo`,
    [id],
  );
  return rowCount > 0;
}

module.exports = {
  buscarPorCorreo,
  crear,
  listar,
  buscarPorId,
  actualizar,
  desactivar,
};
