const pool = require("../config/db");

// Campos públicos: nunca se devuelve contrasena_hash.
const CAMPOS = `u.id, u.nombre, u.correo, u.activo, u.creado_en, r.nombre AS rol`;
const DESDE = `FROM kaiju_usuarios u JOIN kaiju_roles r ON r.id = u.rol_id`;

async function buscarPorCorreo(correo) {
  const { rows } = await pool.query(
    `SELECT ${CAMPOS}, u.contrasena_hash ${DESDE} WHERE u.correo = $1`,
    [correo],
  );
  return rows[0] ?? null;
}

// Solo usuarios activos: los desactivados no aparecen en el listado.
async function listar() {
  const { rows } = await pool.query(
    `SELECT ${CAMPOS} ${DESDE} WHERE u.activo ORDER BY u.id`,
  );
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await pool.query(`SELECT ${CAMPOS} ${DESDE} WHERE u.id = $1`, [
    id,
  ]);
  return rows[0] ?? null;
}

// Si el correo pertenece a un usuario desactivado, lo reactiva con los datos nuevos
// (conserva el id, que el historial del teléfono guarda). El listado oculta a los
// inactivos, así que esta es la forma de recuperarlos. Si está activo: correo repetido.
async function crear(datos, contrasenaHash) {
  const { rows } = await pool.query(
    `INSERT INTO kaiju_usuarios (nombre, correo, contrasena_hash, rol_id)
     VALUES ($1, $2, $3, (SELECT id FROM kaiju_roles WHERE nombre = $4))
     ON CONFLICT (correo) DO UPDATE SET
       nombre = EXCLUDED.nombre, contrasena_hash = EXCLUDED.contrasena_hash,
       rol_id = EXCLUDED.rol_id, activo = TRUE
     WHERE NOT kaiju_usuarios.activo
     RETURNING id`,
    [datos.nombre, datos.correo, contrasenaHash, datos.rol],
  );
  if (rows.length === 0) throw Object.assign(new Error("Correo repetido"), { code: "23505" });
  return buscarPorId(rows[0].id);
}

// Si contrasenaHash es null, la contraseña no se modifica.
async function actualizar(id, datos, contrasenaHash = null) {
  const { rowCount } = await pool.query(
    `UPDATE kaiju_usuarios SET
       nombre = $2, correo = $3,
       rol_id = (SELECT id FROM kaiju_roles WHERE nombre = $4),
       contrasena_hash = COALESCE($5, contrasena_hash)
     WHERE id = $1`,
    [id, datos.nombre, datos.correo, datos.rol, contrasenaHash],
  );
  return rowCount > 0 ? buscarPorId(id) : null;
}

// Borrado lógico: el historial en el teléfono conserva el id del usuario.
async function desactivar(id) {
  const { rowCount } = await pool.query(
    `UPDATE kaiju_usuarios SET activo = FALSE WHERE id = $1 AND activo`,
    [id],
  );
  return rowCount > 0;
}

module.exports = {
  buscarPorCorreo,
  listar,
  buscarPorId,
  crear,
  actualizar,
  desactivar,
};
