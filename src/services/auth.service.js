const bcrypt = require("bcryptjs");
const usuarios = require("../repositories/usuario.repository");
const { firmarToken } = require("../security/jwt");
const { errorHttp } = require("../utils/errores");
const config = require("../config/env");

const HASH_FALSO = bcrypt.hashSync("no-existe", 10);

async function iniciarSesion(cuerpo = {}) {
  const correo = String(cuerpo.correo ?? "")
    .trim()
    .toLowerCase();
  const contrasena = String(cuerpo.contrasena ?? "");
  if (!correo || !contrasena)
    throw errorHttp(400, "Ingresa correo y contraseña");

  const usuario = await usuarios.buscarPorCorreo(correo);
  const coincide = await bcrypt.compare(
    contrasena,
    usuario ? usuario.contrasena_hash : HASH_FALSO,
  );
  if (!usuario || !coincide || !usuario.activo)
    throw errorHttp(401, "Correo o contraseña incorrectos");

  return {
    accessToken: firmarToken(usuario),
    tokenType: "Bearer",
    expiresIn: config.jwt.expira,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  };
}

module.exports = { iniciarSesion };
