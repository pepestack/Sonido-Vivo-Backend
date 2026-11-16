const pool = require("../config/db");

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

async function crear(datos, contrasenaHash) {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (
       rut, nombre, apellido, fecha_nacimiento, correo,
       contrasena_hash, region, comuna, direccion, rol_id
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9,
       (SELECT id FROM roles WHERE nombre = 'Cliente')
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
    ],
  );

  return { ...rows[0], rol: "Cliente" };
}

module.exports = { buscarPorCorreo, crear };
