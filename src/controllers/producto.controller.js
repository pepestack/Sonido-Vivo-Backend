const productoService = require("../services/producto.service");

async function listar(req, res) {
  res.status(200).json(await productoService.listar());
}

async function obtener(req, res) {
  res.status(200).json(await productoService.obtener(req.params.id));
}

async function crear(req, res) {
  res.status(201).json(await productoService.crear(req.body));
}

async function actualizar(req, res) {
  res.status(200).json(await productoService.actualizar(req.params.id, req.body));
}

async function eliminar(req, res) {
  await productoService.eliminar(req.params.id);
  res.status(204).end();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
