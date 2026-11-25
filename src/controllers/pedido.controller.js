const pedidoService = require("../services/pedido.service");

async function crear(req, res) {
  res.status(201).json(await pedidoService.crear(req.body, req.usuario?.id));
}

async function listar(req, res) {
  res.status(200).json(await pedidoService.listar(req.usuario));
}

async function obtener(req, res) {
  res.status(200).json(await pedidoService.obtener(req.params.id, req.usuario));
}

async function actualizar(req, res) {
  res.status(200).json(await pedidoService.actualizar(req.params.id, req.body));
}

async function cancelar(req, res) {
  await pedidoService.cancelar(req.params.id);
  res.status(204).end();
}

module.exports = { crear, listar, obtener, actualizar, cancelar };
