const pool = require("../config/db");

async function buscarPorCorreo(correo) {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.correo, u.contrasena_hash, u.activo, r.nombre AS rol
     FROM usuarios u JOIN roles r ON r.id = u.rol_id
     WHERE u.correo = $1`,
    [correo],
  );
  return rows[0] ?? null;
}

module.exports = { buscarPorCorreo };
