const pool = require("../config/db");

const SELECCIONAR = `
  SELECT p.id, p.usuario_id AS "usuarioId", p.estado, p.total, p.cliente,
         p.entrega, p.subtotal, p.despacho, p.creado_en AS fecha,
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', COALESCE(i.codigo_producto, producto.codigo),
             'productoId', i.producto_id,
             'nombre', COALESCE(i.nombre_producto, producto.nombre),
             'precio', i.precio_unitario,
             'cantidad', i.cantidad
           ) ORDER BY i.producto_id)
           FROM pedido_items i JOIN productos producto ON producto.id = i.producto_id
           WHERE i.pedido_id = p.id
         ), '[]'::json) AS items
  FROM pedidos p`;

async function listar(usuarioId) {
  const { rows } = await pool.query(
    `${SELECCIONAR} WHERE ($1::integer IS NULL OR p.usuario_id = $1)
     ORDER BY p.creado_en DESC, p.id DESC`,
    [usuarioId],
  );
  return rows;
}

async function buscarPorId(id, usuarioId, db = pool) {
  const { rows } = await db.query(
    `${SELECCIONAR} WHERE p.id = $1 AND ($2::integer IS NULL OR p.usuario_id = $2)`,
    [id, usuarioId],
  );
  return rows[0] ?? null;
}

async function enTransaccion(operacion) {
  const db = await pool.connect();
  let errorConexion;
  try {
    await db.query("BEGIN");
    const resultado = await operacion(db);
    await db.query("COMMIT");
    return resultado;
  } catch (error) {
    try {
      await db.query("ROLLBACK");
    } catch (errorRollback) {
      errorConexion = errorRollback;
    }
    throw error;
  } finally {
    db.release(errorConexion);
  }
}

async function bloquearProductos(db, codigos) {
  const { rows } = await db.query(
    `SELECT id, codigo, nombre, precio, precio_promocional, stock, activo
     FROM productos WHERE codigo = ANY($1::text[]) ORDER BY id FOR UPDATE`,
    [codigos],
  );
  return rows;
}

async function crear(db, pedido, items) {
  const { rows: [fila] } = await db.query(
    `INSERT INTO pedidos (usuario_id, cliente, entrega, subtotal, despacho, total, inventario_descontado)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id`,
    [pedido.usuarioId, pedido.cliente, pedido.entrega, pedido.subtotal, pedido.despacho, pedido.total],
  );
  await db.query(
    `INSERT INTO pedido_items
       (pedido_id, producto_id, cantidad, precio_unitario, nombre_producto, codigo_producto)
     SELECT $1, item.* FROM unnest($2::integer[], $3::integer[], $4::integer[], $5::text[], $6::text[]) item`,
    [fila.id, items.map(i => i.id), items.map(i => i.cantidad),
      items.map(i => i.precio), items.map(i => i.nombre), items.map(i => i.codigo)],
  );
  await ajustarStock(db, fila.id, -1);
  return buscarPorId(fila.id, null, db);
}

async function bloquearPedido(db, id) {
  const { rows } = await db.query(
    "SELECT estado, entrega, inventario_descontado FROM pedidos WHERE id = $1 FOR UPDATE",
    [id],
  );
  return rows[0] ?? null;
}

async function actualizarEstado(db, id, estado) {
  await db.query(
    "UPDATE pedidos SET estado = $2, actualizado_en = NOW() WHERE id = $1",
    [id, estado],
  );
  return buscarPorId(id, null, db);
}

async function ajustarStock(db, id, factor) {
  await db.query(
    `UPDATE productos p SET stock = p.stock + $2 * i.cantidad, actualizado_en = NOW()
     FROM pedido_items i WHERE i.pedido_id = $1 AND p.id = i.producto_id`,
    [id, factor],
  );
}

async function cancelar(db, id, inventarioDescontado) {
  if (inventarioDescontado) {
    // Mismo orden de bloqueo que al comprar para evitar interbloqueos.
    await db.query(
      `SELECT p.id FROM productos p JOIN pedido_items i ON i.producto_id = p.id
       WHERE i.pedido_id = $1 ORDER BY p.id FOR UPDATE OF p`,
      [id],
    );
    await ajustarStock(db, id, 1);
  }
  await db.query(
    `UPDATE pedidos SET estado = 'cancelado', inventario_descontado = FALSE, actualizado_en = NOW()
     WHERE id = $1`,
    [id],
  );
}

module.exports = {
  listar, buscarPorId, enTransaccion, bloquearProductos, crear,
  bloquearPedido, actualizarEstado, cancelar,
};
