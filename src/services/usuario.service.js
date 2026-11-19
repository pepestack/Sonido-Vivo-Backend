const usuarios = require("../repositories/usuario.repository");
const authService = require("./auth.service");
const { validarRegistro } = require("../utils/validaciones");
const { errorHttp } = require("../utils/errores");

const ROLES = ["Administrador", "Vendedor", "Cajero", "Cliente"];

const limpiar = (valor) => (typeof valor === "string" ? valor.trim() : valor);
// El id llega como texto en la URL; solo se aceptan enteros positivos.
function parsearId(valor) {
  const id = Number(valor);
  if (!/^\d+$/.test(String(valor)) || !Number.isSafeInteger(id) || id <= 0)
    throw errorHttp(400, "Id inválido");
  return id;
}

async function listar() {
  return usuarios.listar();
}

async function obtener(id) {
  const usuario = await usuarios.buscarPorId(parsearId(id));
  if (!usuario) throw errorHttp(404, "Usuario no encontrado");
  return usuario;
}

async function crear(cuerpo = {}) {
  if (!ROLES.includes(cuerpo.rol))
    throw errorHttp(400, "Revisa los datos", { rol: "Rol inválido" });
  return authService.registrarUsuario(cuerpo, cuerpo.rol);
}

async function actualizar(id, cuerpo = {}) {
  const idUsuario = parsearId(id);
  const datos = {
    nombre: limpiar(cuerpo.nombre),
    apellido: limpiar(cuerpo.apellido),
    fechaNacimiento: limpiar(cuerpo.fechaNacimiento),
    correo:
      typeof cuerpo.correo === "string"
        ? cuerpo.correo.trim().toLowerCase()
        : cuerpo.correo,
    region: limpiar(cuerpo.region),
    comuna: limpiar(cuerpo.comuna),
    direccion: limpiar(cuerpo.direccion),
    rol: cuerpo.rol,
  };

  const errores = validarRegistro(datos);
  delete errores.rut; // el RUN no se modifica
  delete errores.contrasena; // la contraseña no se cambia aquí
  if (!ROLES.includes(datos.rol)) errores.rol = "Rol inválido";

  if (Object.keys(errores).length > 0)
    throw errorHttp(400, "Revisa los datos", errores);

  try {
    const usuario = await usuarios.actualizar(idUsuario, datos);
    if (!usuario) throw errorHttp(404, "Usuario no encontrado");
    return usuario;
  } catch (error) {
    if (error.code === "23505")
      throw errorHttp(409, "El correo ya está registrado");
    throw error;
  }
}

async function eliminar(id) {
  const desactivado = await usuarios.desactivar(parsearId(id));
  if (!desactivado) throw errorHttp(404, "Usuario no encontrado");
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
