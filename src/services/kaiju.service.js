const bcrypt = require("bcryptjs");
const kaijuUsuarios = require("../repositories/kaiju-usuario.repository");
const { firmarToken, AUDIENCIA_KAIJU } = require("../security/jwt");
const { parsearId } = require("../utils/validaciones");
const { errorHttp } = require("../utils/errores");
const config = require("../config/env");
const { HASH_FALSO } = require("./auth.service");

// Deben coincidir con kaiju_roles y con el enum Rol de la app.
const ROLES = ["Administrador", "Encargado de inventario", "Vendedor"];
// KaijuApp acepta correos de cualquier dominio (a diferencia de Sonido Vivo).
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CREDENCIALES_INCORRECTAS = "Correo o contraseña incorrectos";

const limpiar = (valor) => (typeof valor === "string" ? valor.trim() : valor);
const normalizarCorreo = (valor) =>
  typeof valor === "string" ? valor.trim().toLowerCase() : valor;

const correoValido = (correo) =>
  typeof correo === "string" && correo.length <= 100 && REGEX_CORREO.test(correo);

// Los errores se devuelven por campo para que la app los muestre en cada input.
async function iniciarSesion(cuerpo = {}) {
  const correo = normalizarCorreo(cuerpo?.correo);
  const contrasena = cuerpo?.contrasena;

  const errores = {};
  if (!correoValido(correo)) errores.correo = "Ingresa un correo válido";
  if (typeof contrasena !== "string" || contrasena.length === 0)
    errores.contrasena = "Ingresa tu contraseña";
  if (Object.keys(errores).length > 0)
    throw errorHttp(400, "Revisa los datos", errores);

  // Mismo mensaje y mismo tiempo de respuesta (bcrypt siempre se ejecuta) para
  // que no se pueda averiguar qué correos tienen cuenta.
  const usuario = await kaijuUsuarios.buscarPorCorreo(correo);
  const coincide = await bcrypt.compare(
    contrasena,
    usuario ? usuario.contrasena_hash : HASH_FALSO,
  );
  if (!usuario || !coincide || !usuario.activo)
    throw errorHttp(401, CREDENCIALES_INCORRECTAS, {
      correo: CREDENCIALES_INCORRECTAS,
      contrasena: CREDENCIALES_INCORRECTAS,
    });

  return {
    accessToken: firmarToken(usuario, AUDIENCIA_KAIJU),
    tokenType: "Bearer",
    expiresIn: config.jwt.expira,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  };
}

function leerDatos(cuerpo) {
  if (cuerpo === null || typeof cuerpo !== "object" || Array.isArray(cuerpo))
    throw errorHttp(400, "Los datos del usuario deben ser un objeto");
  return {
    nombre: limpiar(cuerpo.nombre),
    correo: normalizarCorreo(cuerpo.correo),
    contrasena: cuerpo.contrasena,
    rol: cuerpo.rol,
  };
}

// Devuelve todos los errores juntos. En PUT la contraseña es opcional.
function validar(datos, { contrasenaObligatoria }) {
  const errores = {};

  if (
    typeof datos.nombre !== "string" ||
    datos.nombre.length === 0 ||
    datos.nombre.length > 100
  )
    errores.nombre = "Nombre requerido (máx. 100)";

  if (!correoValido(datos.correo)) errores.correo = "Correo inválido (máx. 100)";

  const vieneContrasena =
    datos.contrasena !== undefined && datos.contrasena !== null;
  if (
    (contrasenaObligatoria || vieneContrasena) &&
    (typeof datos.contrasena !== "string" ||
      datos.contrasena.length < 4 ||
      datos.contrasena.length > 10)
  )
    errores.contrasena = "La contraseña debe tener entre 4 y 10 caracteres";

  if (!ROLES.includes(datos.rol)) errores.rol = "Rol inválido";

  if (Object.keys(errores).length > 0)
    throw errorHttp(400, "Revisa los datos", errores);
}

function correoDuplicado(error) {
  if (error.code === "23505")
    return errorHttp(409, "El correo ya está registrado", {
      correo: "El correo ya está registrado",
    });
  return error;
}

async function listar() {
  return kaijuUsuarios.listar();
}

async function obtener(id) {
  const usuario = await kaijuUsuarios.buscarPorId(parsearId(id));
  if (!usuario) throw errorHttp(404, "Usuario no encontrado");
  return usuario;
}

async function crear(cuerpo) {
  const datos = leerDatos(cuerpo);
  validar(datos, { contrasenaObligatoria: true });

  const hash = await bcrypt.hash(datos.contrasena, 10);
  try {
    return await kaijuUsuarios.crear(datos, hash);
  } catch (error) {
    throw correoDuplicado(error);
  }
}

async function actualizar(id, cuerpo, solicitante = {}) {
  const idUsuario = parsearId(id);
  const datos = leerDatos(cuerpo);
  validar(datos, { contrasenaObligatoria: false });

  // Evita que el administrador se quite a sí mismo el acceso.
  if (idUsuario === solicitante.id && datos.rol !== solicitante.rol)
    throw errorHttp(409, "No puedes cambiar tu propio rol");

  const hash =
    typeof datos.contrasena === "string"
      ? await bcrypt.hash(datos.contrasena, 10)
      : null;

  let usuario;
  try {
    usuario = await kaijuUsuarios.actualizar(idUsuario, datos, hash);
  } catch (error) {
    throw correoDuplicado(error);
  }
  if (!usuario) throw errorHttp(404, "Usuario no encontrado");
  return usuario;
}

async function eliminar(id, solicitante = {}) {
  const idUsuario = parsearId(id);
  if (idUsuario === solicitante.id)
    throw errorHttp(409, "No puedes desactivar tu propia cuenta");

  const desactivado = await kaijuUsuarios.desactivar(idUsuario);
  if (!desactivado) throw errorHttp(404, "Usuario no encontrado");
}

module.exports = { iniciarSesion, listar, obtener, crear, actualizar, eliminar };
