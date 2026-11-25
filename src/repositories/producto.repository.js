const pool = require("../config/db");

// precio_final es una columna generada (ver schema.sql): la misma que cobra el pedido.
// actualizadoEn sirve de versión: el PUT debe devolverlo para no pisar cambios ajenos.
const CAMPOS = `p.id, p.codigo, p.nombre, p.marca, p.modelo, p.descripcion,
                c.nombre AS categoria, p.precio,
                p.precio_promocional AS "precioPromocional",
                p.precio_final AS "precioFinal",
                p.stock, p.imagen, p.actualizado_en AS "actualizadoEn"`;
const DESDE = `FROM productos p JOIN categorias c ON c.id = p.categoria_id`;
// Un producto de una categoría desactivada tampoco se muestra ni se vende.
const VISIBLE = `p.activo AND c.activo`;

async function listar() {
  const { rows } = await pool.query(
    `SELECT ${CAMPOS} ${DESDE} WHERE ${VISIBLE} ORDER BY p.id`,
  );
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    `SELECT ${CAMPOS} ${DESDE} WHERE p.id = $1 AND ${VISIBLE}`,
    [id],
  );
  return rows[0] ?? null;
}

async function existe(id) {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM productos WHERE id = $1 AND activo`,
    [id],
  );
  return rowCount > 0;
}

async function existeCategoria(nombre) {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM categorias WHERE nombre = $1 AND activo`,
    [nombre],
  );
  return rowCount > 0;
}

async function crear(d) {
  const { rows } = await pool.query(
    `INSERT INTO productos
       (codigo, nombre, marca, modelo, descripcion, categoria_id, precio, stock, imagen, precio_promocional)
     VALUES ($1, $2, $3, $4, $5, (SELECT id FROM categorias WHERE nombre = $6), $7, $8, $9, $10)
     RETURNING id`,
    [d.codigo, d.nombre, d.marca, d.modelo, d.descripcion, d.categoria, d.precio, d.stock, d.imagen,
      d.precioPromocional],
  );
  return buscarPorId(rows[0].id);
}

// Solo actualiza si nadie modificó el producto (ni una venta ni otro usuario)
// desde que se leyó. JS guarda milisegundos y PostgreSQL microsegundos: se trunca.
// Devuelve null si no se actualizó; el servicio distingue 404 de 409 con existe().
async function actualizar(id, d) {
  const { rowCount } = await pool.query(
    `UPDATE productos SET
       codigo = $2, nombre = $3, marca = $4, modelo = $5, descripcion = $6,
       categoria_id = (SELECT id FROM categorias WHERE nombre = $7),
       precio = $8, stock = $9, imagen = $10, precio_promocional = $11, actualizado_en = NOW()
     WHERE id = $1 AND activo
       AND date_trunc('milliseconds', actualizado_en) = $12::timestamptz`,
    [id, d.codigo, d.nombre, d.marca, d.modelo, d.descripcion, d.categoria, d.precio, d.stock, d.imagen,
      d.precioPromocional, d.actualizadoEn],
  );
  return rowCount > 0 ? buscarPorId(id) : null;
}

async function desactivar(id) {
  const { rowCount } = await pool.query(
    `UPDATE productos SET activo = FALSE, actualizado_en = NOW() WHERE id = $1 AND activo`,
    [id],
  );
  return rowCount > 0;
}

module.exports = { listar, buscarPorId, existe, existeCategoria, crear, actualizar, desactivar };
