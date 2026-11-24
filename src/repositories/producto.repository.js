const pool = require("../config/db");

const CAMPOS = `p.id, p.codigo, p.nombre, p.marca, p.modelo, p.descripcion,
                c.nombre AS categoria, p.precio, p.stock, p.imagen`;
const DESDE = `FROM productos p JOIN categorias c ON c.id = p.categoria_id`;

async function listar() {
  const { rows } = await pool.query(
    `SELECT ${CAMPOS} ${DESDE} WHERE p.activo ORDER BY p.id`,
  );
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    `SELECT ${CAMPOS} ${DESDE} WHERE p.id = $1 AND p.activo`,
    [id],
  );
  return rows[0] ?? null;
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
       (codigo, nombre, marca, modelo, descripcion, categoria_id, precio, stock, imagen)
     VALUES ($1, $2, $3, $4, $5, (SELECT id FROM categorias WHERE nombre = $6), $7, $8, $9)
     RETURNING id`,
    [d.codigo, d.nombre, d.marca, d.modelo, d.descripcion, d.categoria, d.precio, d.stock, d.imagen],
  );
  return buscarPorId(rows[0].id);
}

async function actualizar(id, d) {
  const { rowCount } = await pool.query(
    `UPDATE productos SET
       codigo = $2, nombre = $3, marca = $4, modelo = $5, descripcion = $6,
       categoria_id = (SELECT id FROM categorias WHERE nombre = $7),
       precio = $8, stock = $9, imagen = $10, actualizado_en = NOW()
     WHERE id = $1 AND activo`,
    [id, d.codigo, d.nombre, d.marca, d.modelo, d.descripcion, d.categoria, d.precio, d.stock, d.imagen],
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

module.exports = { listar, buscarPorId, existeCategoria, crear, actualizar, desactivar };
