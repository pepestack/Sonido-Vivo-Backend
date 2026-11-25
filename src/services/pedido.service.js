const pedidos = require("../repositories/pedido.repository");
const { parsearId } = require("../utils/validaciones");
const { errorHttp } = require("../utils/errores");

const MAX_INT = 2147483647;
const MAX_UNIDADES = 5;
const COSTO_DESPACHO = 6767;
const ESTADOS = {
  pendiente: "En preparación",
  confirmado: "Confirmado",
  enviado: "Despachado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};
const ESTADOS_ACTUALIZABLES = new Map([
  ["Despachado", "enviado"],
  ["Entregado", "entregado"],
]);

const esObjeto = (valor) => valor !== null && typeof valor === "object" && !Array.isArray(valor);
const texto = (valor) => typeof valor === "string" ? valor.trim() : "";
const presentar = (pedido) => ({ ...pedido, estado: ESTADOS[pedido.estado] });

function idPedido(valor) {
  const id = parsearId(valor);
  if (id > MAX_INT) throw errorHttp(400, "Id inválido");
  return id;
}

function leerContacto(valor) {
  const nombre = texto(valor?.nombre);
  const apellido = texto(valor?.apellido);
  const correo = texto(valor?.correo).toLowerCase();
  if (!nombre || nombre.length > 50 || !apellido || apellido.length > 100 ||
      correo.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw errorHttp(400, "Indica un nombre, apellido y correo válidos", {
      cliente: "Revisa los datos de contacto",
    });
  }
  return { nombre, apellido, correo };
}

function leerEntrega(valor) {
  const tipo = valor?.tipo;
  if (tipo === "retiro") return { tipo };
  const region = texto(valor?.region);
  const comuna = texto(valor?.comuna);
  const direccion = texto(valor?.direccion);
  if (tipo !== "despacho" || !region || region.length > 100 ||
      !comuna || comuna.length > 100 || !direccion || direccion.length > 300) {
    throw errorHttp(400, "Indica el tipo de entrega y los datos de despacho", {
      entrega: "El despacho requiere región, comuna y dirección",
    });
  }
  return { tipo, region, comuna, direccion };
}

function leerItems(items) {
  if (!Array.isArray(items) || items.length === 0)
    throw errorHttp(400, "Agrega al menos un producto al pedido");

  const cantidades = new Map();
  for (const item of items) {
    const codigo = texto(item?.codigo).toUpperCase();
    const cantidad = item?.cantidad;
    if (!/^[A-Z0-9-]{2,10}$/.test(codigo) || !Number.isInteger(cantidad) || cantidad < 1)
      throw errorHttp(400, "Cada ítem requiere un código y una cantidad entera positiva");
    const unidades = (cantidades.get(codigo) ?? 0) + cantidad;
    if (unidades > MAX_UNIDADES)
      throw errorHttp(400, "El máximo es de cinco unidades por producto", { codigo });
    cantidades.set(codigo, unidades);
  }
  return cantidades;
}

async function crear(cuerpo, usuarioId = null) {
  if (!esObjeto(cuerpo)) throw errorHttp(400, "Los datos del pedido deben ser un objeto");
  const cantidades = leerItems(cuerpo.items);
  const cliente = leerContacto(cuerpo.cliente);
  const entrega = leerEntrega(cuerpo.entrega);
  const pago = cuerpo.pagoSimulado === undefined ? "aprobado" : cuerpo.pagoSimulado;
  if (pago !== "aprobado" && pago !== "rechazado")
    throw errorHttp(400, "El resultado del pago simulado debe ser aprobado o rechazado");
  if (pago === "rechazado") throw errorHttp(409, "El pago simulado fue rechazado");

  return pedidos.enTransaccion(async (db) => {
    const codigos = [...cantidades.keys()];
    const productos = await pedidos.bloquearProductos(db, codigos);
    const porCodigo = new Map(productos.map(producto => [producto.codigo, producto]));
    const items = codigos.map((codigo) => {
      const producto = porCodigo.get(codigo);
      const cantidad = cantidades.get(codigo);
      if (!producto?.activo) throw errorHttp(404, "Producto no disponible", { codigo });
      if (producto.stock < cantidad) throw errorHttp(409, "Stock insuficiente", { codigo });

      const promocional = producto.precio_promocional;
      const precio = promocional !== null && promocional < producto.precio
        ? promocional
        : producto.precio;
      return { id: producto.id, codigo, nombre: producto.nombre, cantidad, precio };
    });
    const subtotal = items.reduce((suma, item) => suma + item.cantidad * item.precio, 0);
    const despacho = entrega.tipo === "despacho" ? COSTO_DESPACHO : 0;
    const total = subtotal + despacho;
    if (total > MAX_INT) throw errorHttp(400, "El total supera el monto máximo admitido");
    return presentar(await pedidos.crear(db, { usuarioId, cliente, entrega, subtotal, despacho, total }, items));
  });
}

async function listar(usuario) {
  const filas = await pedidos.listar(usuario.rol === "Cliente" ? usuario.id : null);
  return filas.map(presentar);
}

async function obtener(id, usuario) {
  const pedido = await pedidos.buscarPorId(idPedido(id), usuario.rol === "Cliente" ? usuario.id : null);
  if (!pedido) throw errorHttp(404, "Pedido no encontrado");
  return presentar(pedido);
}

async function actualizar(id, cuerpo) {
  const idValido = idPedido(id);
  const estado = ESTADOS_ACTUALIZABLES.get(cuerpo?.estado);
  if (!estado) throw errorHttp(400, "El estado debe ser Despachado o Entregado");

  return pedidos.enTransaccion(async (db) => {
    const pedido = await pedidos.bloquearPedido(db, idValido);
    if (!pedido) throw errorHttp(404, "Pedido no encontrado");
    const enPreparacion = pedido.estado === "pendiente" || pedido.estado === "confirmado";
    const siguiente = enPreparacion
      ? (pedido.entrega?.tipo === "retiro" ? "entregado" : "enviado")
      : (pedido.estado === "enviado" ? "entregado" : null);
    if (estado !== siguiente)
      throw errorHttp(409, "El pedido no puede pasar a ese estado");

    return presentar(await pedidos.actualizarEstado(db, idValido, estado));
  });
}

async function cancelar(id) {
  const idValido = idPedido(id);
  return pedidos.enTransaccion(async (db) => {
    const pedido = await pedidos.bloquearPedido(db, idValido);
    if (!pedido) throw errorHttp(404, "Pedido no encontrado");
    if (pedido.estado !== "pendiente")
      throw errorHttp(409, "Solo se pueden cancelar pedidos En preparación");
    await pedidos.cancelar(db, idValido, pedido.inventario_descontado);
  });
}

module.exports = { crear, listar, obtener, actualizar, cancelar };
