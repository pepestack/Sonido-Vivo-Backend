const bcrypt = require("bcryptjs");
const usuarios = require("../repositories/usuario.repository");
const { firmarToken } = require("../security/jwt");
const { errorHttp } = require("../utils/errores");
const config = require("../config/env");
const { validarRegistro } = require("../utils/validaciones");

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

async function registrarUsuario(cuerpo = {}, rol = "Cliente") {
  if (cuerpo === null || typeof cuerpo !== "object" || Array.isArray(cuerpo)) {
    throw errorHttp(400, "Los datos de registro deben ser un objeto");
  }

  const limpiarTexto = (valor) =>
    typeof valor === "string" ? valor.trim() : valor;

  const datos = {
    rut: limpiarTexto(cuerpo.rut),
    nombre: limpiarTexto(cuerpo.nombre),
    apellido: limpiarTexto(cuerpo.apellido),
    fechaNacimiento: limpiarTexto(cuerpo.fechaNacimiento),
    correo: limpiarTexto(cuerpo.correo),
    contrasena: cuerpo.contrasena,
    region: limpiarTexto(cuerpo.region),
    comuna: limpiarTexto(cuerpo.comuna),
    direccion: limpiarTexto(cuerpo.direccion),
  };

  if (typeof datos.rut === "string") datos.rut = datos.rut.toUpperCase();

  if (typeof datos.correo === "string")
    datos.correo = datos.correo.toLowerCase();

  const errores = validarRegistro(datos);

  if (Object.keys(errores).length > 0)
    throw errorHttp(400, "Revisa los datos del registro", errores);

  const contrasenaHash = await bcrypt.hash(datos.contrasena, 10);

  try {
    const usuario = await usuarios.crear(datos, contrasenaHash, rol);

    return {
      mensaje: "Usuario registrado correctamente",
      usuario,
    };
  } catch (error) {
    if (error.code === "23505")
      throw errorHttp(409, "El correo o RUN ya está registrado");

    throw error;
  }
}

module.exports = { iniciarSesion, registrarUsuario, HASH_FALSO };
