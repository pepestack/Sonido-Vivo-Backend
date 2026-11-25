const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const { test } = require("node:test");
const { Pool } = require("pg");

process.env.JWT_SECRET = "clave-solo-para-pruebas-de-pedidos";

const pedidoService = require("../src/services/pedido.service");
const openapi = require("../src/docs/openapi");
const { firmarToken } = require("../src/security/jwt");
const URL_PEDIDOS = "/api/v1/pedidos";

function datosPedido(codigo, cantidad = 1) {
  return {
    items: [{ codigo, cantidad }],
    cliente: { nombre: "Ana", apellido: "Rojas", correo: "ana@example.com" },
    entrega: { tipo: "retiro" },
  };
}

test("el límite de cinco aplica al total del mismo código, aunque venga en varias líneas", async () => {
  const pedido = datosPedido("GA001", 3);
  pedido.items.push({ codigo: " ga001 ", cantidad: 3 });
  await assert.rejects(pedidoService.crear(pedido), { status: 400 });
});

test("la documentación indica que la cancelación devuelve 409 fuera del estado En preparación", () => {
  const operacion = openapi.paths["/api/v1/pedidos/{id}"].delete;
  assert.deepEqual(operacion.security, [{ bearerAuth: [] }]);
  assert.ok(operacion.responses[204]);
  assert.match(operacion.responses[409].description, /En preparación/);
});

const url = process.env.TEST_DATABASE_URL;
test("API de pedidos con PostgreSQL", { skip: !url && "Define TEST_DATABASE_URL para probar con PostgreSQL" }, async (t) => {
  const esquema = "test_pedidos_" + randomUUID().replaceAll("-", "");
  const administracion = new Pool({ connectionString: url });
  const db = require("../src/config/db");
  db.options.connectionString = url;
  delete db.options.ssl;
  db.options.options = "-c search_path=" + esquema;
  t.after(async () => {
    try {
      await db.end();
      await administracion.query(`DROP SCHEMA IF EXISTS ${esquema} CASCADE`);
    } finally {
      await administracion.end();
    }
  });

  await administracion.query(`CREATE SCHEMA ${esquema}`);
  const schemaSql = await readFile(path.join(__dirname, "../src/db/schema.sql"), "utf8");
  await db.query("CREATE TABLE roles (id SMALLSERIAL PRIMARY KEY, nombre VARCHAR(30) NOT NULL UNIQUE)");
  await db.query("INSERT INTO roles (nombre) VALUES ('Cajero')");
  await db.query(schemaSql);
  const inicial = await db.query("SELECT id FROM roles WHERE nombre = 'Cajero'");
  assert.equal(inicial.rowCount, 1);

  async function usuario(rol, numero) {
    const { rows: [fila] } = await db.query(
      `INSERT INTO usuarios (rut, nombre, apellido, correo, contrasena_hash, region, comuna, direccion, rol_id)
       SELECT $1, 'Ana', 'Rojas', $2, 'solo-pruebas', 'Region', 'Comuna', 'Calle', id FROM roles WHERE nombre = $3
       RETURNING id`,
      [String(numero), `prueba${numero}@example.com`, rol],
    );
    return { id: fila.id, token: firmarToken({ id: fila.id, rol }) };
  }

  const ana = await usuario("Cliente", 1);
  const otro = await usuario("Cliente", 2);
  const admin = await usuario("Administrador", 3);
  const vendedor = await usuario("Vendedor", 4);
  const cajero = await usuario("Cajero", 5);

  const { handler } = require("../lambda");
  async function api(httpMethod, { id, token, datos } = {}) {
    const respuesta = await handler({
      httpMethod,
      path: id === undefined ? URL_PEDIDOS : URL_PEDIDOS + "/" + id,
      headers: {
        ...(token && { Authorization: "Bearer " + token }),
        ...(datos !== undefined && { "Content-Type": "application/json" }),
      },
      body: datos === undefined ? null : JSON.stringify(datos),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    }, {});
    return { status: respuesta.statusCode, pedido: respuesta.body ? JSON.parse(respuesta.body) : undefined };
  }

  async function producto(codigo, stock, promocion = null) {
    await db.query(
      `INSERT INTO productos (codigo, nombre, marca, modelo, categoria_id, precio, precio_promocional, stock)
       SELECT $1, 'Producto de prueba', 'Marca', 'Modelo', id, 10000, $2, $3
       FROM categorias WHERE nombre = 'Accesorios'`,
      [codigo, promocion, stock],
    );
  }

  async function stock(codigo) {
    const { rows: [fila] } = await db.query("SELECT stock FROM productos WHERE codigo = $1", [codigo]);
    return fila.stock;
  }

  await t.test("invitado recibe su comprobante con precio promocional y despacho", async () => {
    await producto("PROMO", 7, 7500);
    const datos = {
      ...datosPedido("PROMO", 2),
      entrega: { tipo: "despacho", region: "Valparaíso", comuna: "Concón", direccion: "Av. Principal 123" },
      usuarioId: ana.id,
      precio: 1,
      total: 1,
      numeroTarjeta: "tarjeta-de-prueba",
      cvv: "no-persistir",
    };
    const respuesta = await api("POST", { datos });
    assert.equal(respuesta.status, 201);
    const { pedido } = respuesta;
    assert.equal(pedido.usuarioId, null);
    assert.equal(pedido.despacho, 6767);
    assert.equal(pedido.subtotal, 15000);
    assert.equal(pedido.total, 21767);
    assert.equal(pedido.estado, "En preparación");
    assert.equal(pedido.items[0].precio, 7500);
    assert.equal(await stock("PROMO"), 5);

    await db.query("UPDATE productos SET nombre = 'Otro nombre', precio_promocional = 5000 WHERE codigo = 'PROMO'");
    const detalle = await api("GET", { id: pedido.id, token: vendedor.token });
    assert.equal(detalle.status, 200);
    assert.deepEqual(detalle.pedido.items, pedido.items);
    assert.equal(detalle.pedido.entrega.direccion, datos.entrega.direccion);
    assert.doesNotMatch(JSON.stringify(detalle.pedido), /tarjeta-de-prueba|no-persistir/);
    assert.equal((await api("GET", { id: pedido.id, token: ana.token })).status, 404);
    assert.equal((await api("GET", { id: pedido.id })).status, 401);
  });

  await t.test("compra autenticada usa la identidad del JWT y el cliente solo consulta sus pedidos", async () => {
    await producto("CUENTA", 5);
    const datos = { ...datosPedido("CUENTA", 5), usuarioId: otro.id };
    assert.equal((await api("POST", { token: "invalido", datos })).status, 401);
    const respuesta = await api("POST", { token: ana.token, datos });
    assert.equal(respuesta.status, 201);
    assert.equal(respuesta.pedido.usuarioId, ana.id);
    assert.equal(respuesta.pedido.despacho, 0);
    assert.equal(await stock("CUENTA"), 0);
    const id = respuesta.pedido.id;
    assert.deepEqual((await api("GET", { token: ana.token })).pedido.map(p => p.id), [id]);
    assert.equal((await api("GET", { token: ana.token, id })).status, 200);
    assert.equal((await api("GET", { token: otro.token, id })).status, 404);
    assert.equal((await api("GET", { token: cajero.token })).status, 403);
    assert.equal((await api("GET", { token: admin.token, id: "2147483648" })).status, 400);
  });

  await t.test("rechaza venta con datos inválidos, producto inexistente o fallo del pago simulado", async () => {
    await producto("ERROR", 3);
    const datos = datosPedido("ERROR");
    const casos = [
      [{ ...datos, items: [] }, 400],
      [{ ...datos, items: [{ codigo: "ERROR", cantidad: 6 }] }, 400],
      [{ ...datos, entrega: { tipo: "despacho" } }, 400],
      [{ ...datos, items: [{ codigo: "FALTA", cantidad: 1 }] }, 404],
      [{ ...datos, pagoSimulado: "rechazado" }, 409],
      [{ ...datos, items: [...datos.items, { codigo: "PROMO", cantidad: 6 }] }, 400],
    ];
    for (const [entrada, status] of casos) {
      assert.equal((await api("POST", { datos: entrada })).status, status);
    }
    const conFaltaStock = { ...datos, items: [...datos.items, { codigo: "CUENTA", cantidad: 1 }] };
    assert.equal((await api("POST", { datos: conFaltaStock })).status, 409);
    assert.equal(await stock("ERROR"), 3);
  });

  await t.test("dos compras simultáneas por el último stock solo registran un pedido", async () => {
    await producto("ULTIMO", 2);
    const datos = datosPedido("ULTIMO", 2);
    const resultados = await Promise.all([api("POST", { datos }), api("POST", { datos })]);
    assert.deepEqual(resultados.map(r => r.status).sort(), [201, 409]);
    assert.equal(await stock("ULTIMO"), 0);
    const { rows } = await db.query("SELECT cantidad FROM pedido_items WHERE codigo_producto = 'ULTIMO'");
    assert.deepEqual(rows, [{ cantidad: 2 }]);
  });

  await t.test("si falla el descuento, PostgreSQL revierte el pedido y sus ítems", async () => {
    await producto("FALLADB", 2);
    await db.query(
      "ALTER TABLE productos ADD CONSTRAINT fallo_descuento CHECK (codigo <> 'FALLADB' OR stock = 2)",
    );
    const contarPedidos = async () => (await db.query("SELECT count(*)::integer AS total FROM pedidos")).rows[0].total;
    const antes = await contarPedidos();
    assert.equal((await api("POST", { datos: datosPedido("FALLADB") })).status, 500);
    assert.equal(await stock("FALLADB"), 2);
    assert.equal(await contarPedidos(), antes);
    const { rowCount } = await db.query("SELECT 1 FROM pedido_items WHERE codigo_producto = 'FALLADB'");
    assert.equal(rowCount, 0);
  });

  await t.test("solo Administrador cancela y la cancelación concurrente repone el inventario una vez", async () => {
    await producto("CANCELAR", 5);
    const { pedido } = await api("POST", { datos: datosPedido("CANCELAR", 2) });
    const id = pedido.id;
    assert.equal(await stock("CANCELAR"), 3);
    assert.equal((await api("DELETE", { id })).status, 401);
    for (const { token } of [ana, vendedor, cajero]) {
      assert.equal((await api("DELETE", { id, token })).status, 403);
    }
    assert.equal(await stock("CANCELAR"), 3);
    const peticion = { id, token: admin.token };
    const resultados = await Promise.all([api("DELETE", peticion), api("DELETE", peticion)]);
    assert.deepEqual(resultados.map(r => r.status).sort(), [204, 409]);
    assert.equal(await stock("CANCELAR"), 5);
    assert.equal((await api("DELETE", peticion)).status, 409);
    assert.equal(await stock("CANCELAR"), 5);
    const detalle = await api("GET", peticion);
    assert.equal(detalle.pedido.estado, "Cancelado");
    assert.deepEqual(detalle.pedido.items, pedido.items);
  });

  await t.test("pedidos despachados y entregados no se cancelan; el retiro se entrega directamente", async () => {
    await producto("ESTADO", 5);
    const datos = datosPedido("ESTADO");
    datos.entrega = { tipo: "despacho", region: "Región", comuna: "Comuna", direccion: "Calle" };
    const { pedido: despacho } = await api("POST", { datos });
    const vendedorDespacho = { id: despacho.id, token: vendedor.token };
    const adminDespacho = { id: despacho.id, token: admin.token };
    assert.equal((await api("PUT", { ...vendedorDespacho, datos: { estado: "Cancelado" } })).status, 400);
    assert.equal((await api("PUT", { ...vendedorDespacho, datos: { estado: "Entregado" } })).status, 409);
    assert.equal((await api("PUT", { ...vendedorDespacho, datos: { estado: "Despachado" } })).pedido.estado, "Despachado");
    assert.equal((await api("DELETE", adminDespacho)).status, 409);
    assert.equal((await api("PUT", { ...vendedorDespacho, datos: { estado: "Entregado" } })).pedido.estado, "Entregado");
    assert.equal((await api("DELETE", adminDespacho)).status, 409);
    const { pedido: retiro } = await api("POST", { datos: datosPedido("ESTADO") });
    const entregaRetiro = await api("PUT", { id: retiro.id, token: vendedor.token, datos: { estado: "Entregado" } });
    assert.equal(entregaRetiro.pedido.estado, "Entregado");
    assert.equal(await stock("ESTADO"), 3);
  });

  await t.test("reaplicar el esquema conserva los datos y los pedidos antiguos no reponen stock sin evidencia", async () => {
    const { rows: [pedido] } = await db.query("INSERT INTO pedidos (usuario_id, total) VALUES ($1, 10000) RETURNING id", [ana.id]);
    await db.query(
      `INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario)
       SELECT $1, id, 1, 10000 FROM productos WHERE codigo = 'ESTADO'`,
      [pedido.id],
    );
    await db.query(schemaSql);
    const peticion = { id: pedido.id, token: admin.token };
    assert.equal((await api("DELETE", peticion)).status, 204);
    assert.equal(await stock("ESTADO"), 3);
    assert.equal((await api("GET", peticion)).pedido.items[0].cantidad, 1);
  });
});
