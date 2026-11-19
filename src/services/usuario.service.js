const usuarios = require("../repositories/usuario.repository");
const authService = require("./auth.service");
const { validarRegistro } = require("../utils/validaciones");
const { errorHttp } = require("../utils/errores");

const ROLES = ["Administrador", "Vendedor", "Cajero", "Cliente"];

const limpiar = (valor) => (typeof valor === "string" ? valor.trim() : valor);
const normalizarRut = (rut) => String(rut).trim().toUpperCase();

async function listar() {
  return usuarios.listar();
}

async function obtener(rut) {
  const usuario = await usuarios.buscarPorRut(normalizarRut(rut));
  if (!usuario) throw errorHttp(404, "Usuario no encontrado");
  return usuario;
}

async function crear(cuerpo = {}) {
  if (!ROLES.includes(cuerpo.rol))
    throw errorHttp(400, "Revisa los datos", { rol: "Rol inválido" });
  return authService.registrarUsuario(cuerpo, cuerpo.rol);
}

async function actualizar(rut, cuerpo = {}) {
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
  delete errores.rut; // el RUT viene en la URL y no se modifica
  delete errores.contrasena; // la contraseña no se cambia aquí
  if (!ROLES.includes(datos.rol)) errores.rol = "Rol inválido";

  if (Object.keys(errores).length > 0)
    throw errorHttp(400, "Revisa los datos", errores);

  try {
    const usuario = await usuarios.actualizar(normalizarRut(rut), datos);
    if (!usuario) throw errorHttp(404, "Usuario no encontrado");
    return usuario;
  } catch (error) {
    if (error.code === "23505")
      throw errorHttp(409, "El correo ya está registrado");
    throw error;
  }
}

async function eliminar(rut) {
  const desactivado = await usuarios.desactivar(normalizarRut(rut));
  if (!desactivado) throw errorHttp(404, "Usuario no encontrado");
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
