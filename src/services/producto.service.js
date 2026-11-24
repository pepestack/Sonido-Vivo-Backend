const productos = require("../repositories/producto.repository");
const { parsearId } = require("../utils/validaciones");
const { errorHttp } = require("../utils/errores");

const PRECIO_MAXIMO = 100000000;
const STOCK_MAXIMO = 1000000;

const limpiar = (valor) => (typeof valor === "string" ? valor.trim() : valor);

const textoValido = (valor, maximo) =>
  typeof valor === "string" && valor.length > 0 && valor.length <= maximo;

const opcional = (valor) => (valor === undefined || valor === "" ? null : valor);

function normalizar(cuerpo) {
  const codigo = limpiar(cuerpo.codigo);
  return {
    codigo: typeof codigo === "string" ? codigo.toUpperCase() : codigo,
    nombre: limpiar(cuerpo.nombre),
    marca: limpiar(cuerpo.marca),
    modelo: limpiar(cuerpo.modelo),
    descripcion: opcional(limpiar(cuerpo.descripcion)),
    categoria: limpiar(cuerpo.categoria),
    precio: cuerpo.precio,
    stock: cuerpo.stock,
    imagen: opcional(limpiar(cuerpo.imagen)),
  };
}

function validar(d) {
  const errores = {};

  if (typeof d.codigo !== "string" || !/^[A-Z0-9-]{2,10}$/.test(d.codigo))
    errores.codigo = "Código de 2 a 10 caracteres (letras, números o guion)";
  if (!textoValido(d.nombre, 100)) errores.nombre = "Nombre requerido (máx. 100)";
  if (!textoValido(d.marca, 50)) errores.marca = "Marca requerida (máx. 50)";
  if (!textoValido(d.modelo, 50)) errores.modelo = "Modelo requerido (máx. 50)";
  if (d.descripcion !== null && !textoValido(d.descripcion, 500))
    errores.descripcion = "Descripción de máximo 500 caracteres";
  if (!textoValido(d.categoria, 50)) errores.categoria = "Selecciona una categoría";
  if (!Number.isInteger(d.precio) || d.precio < 0 || d.precio > PRECIO_MAXIMO)
    errores.precio = `El precio debe ser un entero entre 0 y ${PRECIO_MAXIMO}`;
  if (!Number.isInteger(d.stock) || d.stock < 0 || d.stock > STOCK_MAXIMO)
    errores.stock = `El stock debe ser un entero entre 0 y ${STOCK_MAXIMO}`;
  if (d.imagen !== null && !textoValido(d.imagen, 500))
    errores.imagen = "Imagen de máximo 500 caracteres";

  return errores;
}

async function prepararDatos(cuerpo = {}) {
  const datos = normalizar(cuerpo ?? {});
  const errores = validar(datos);

  if (!errores.categoria && !(await productos.existeCategoria(datos.categoria)))
    errores.categoria = "La categoría no existe";

  if (Object.keys(errores).length > 0)
    throw errorHttp(400, "Revisa los datos del producto", errores);

  return datos;
}

function traducirError(error) {
  if (error.code === "23505")
    return errorHttp(409, "Ya existe un producto con ese código", {
      codigo: "Código repetido",
    });
  return error;
}

async function listar() {
  return productos.listar();
}

async function obtener(id) {
  const producto = await productos.buscarPorId(parsearId(id));
  if (!producto) throw errorHttp(404, "Producto no encontrado");
  return producto;
}

async function crear(cuerpo) {
  const datos = await prepararDatos(cuerpo);
  try {
    return await productos.crear(datos);
  } catch (error) {
    throw traducirError(error);
  }
}

async function actualizar(id, cuerpo) {
  const idProducto = parsearId(id);
  const datos = await prepararDatos(cuerpo);
  try {
    const producto = await productos.actualizar(idProducto, datos);
    if (!producto) throw errorHttp(404, "Producto no encontrado");
    return producto;
  } catch (error) {
    throw traducirError(error);
  }
}

async function eliminar(id) {
  const desactivado = await productos.desactivar(parsearId(id));
  if (!desactivado) throw errorHttp(404, "Producto no encontrado");
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
