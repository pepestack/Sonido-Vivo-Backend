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
    precioPromocional: opcional(cuerpo.precioPromocional),
    actualizadoEn: cuerpo.actualizadoEn,
  };
}

const fechaValida = (valor) =>
  typeof valor === "string" && !Number.isNaN(Date.parse(valor));

function validar(d, { conVersion }) {
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
  // Una promoción igual o mayor al precio no se cobraría: se rechaza para no confundir.
  if (
    d.precioPromocional !== null &&
    (!Number.isInteger(d.precioPromocional) ||
      d.precioPromocional < 0 ||
      (Number.isInteger(d.precio) && d.precioPromocional >= d.precio))
  )
    errores.precioPromocional = "El precio promocional debe ser un entero menor que el precio";
  if (conVersion && !fechaValida(d.actualizadoEn))
    errores.actualizadoEn = "Envía el actualizadoEn que recibiste al leer el producto";

  return errores;
}

async function prepararDatos(cuerpo = {}, opciones = { conVersion: false }) {
  const datos = normalizar(cuerpo ?? {});
  const errores = validar(datos, opciones);

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
  const datos = await prepararDatos(cuerpo, { conVersion: true });
  let producto;
  try {
    producto = await productos.actualizar(idProducto, datos);
  } catch (error) {
    throw traducirError(error);
  }
  if (producto) return producto;
  if (await productos.existe(idProducto))
    throw errorHttp(409, "El producto fue modificado por otra operación, recarga e intenta de nuevo", {
      actualizadoEn: "Versión desactualizada",
    });
  throw errorHttp(404, "Producto no encontrado");
}

async function eliminar(id) {
  const desactivado = await productos.desactivar(parsearId(id));
  if (!desactivado) throw errorHttp(404, "Producto no encontrado");
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
