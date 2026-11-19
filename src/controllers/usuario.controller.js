const usuarioService = require("../services/usuario.service");

async function listar(req, res) {
  res.status(200).json(await usuarioService.listar());
}

async function obtener(req, res) {
  res.status(200).json(await usuarioService.obtener(req.params.rut));
}

async function crear(req, res) {
  res.status(201).json(await usuarioService.crear(req.body));
}

async function actualizar(req, res) {
  res.status(200).json(await usuarioService.actualizar(req.params.rut, req.body));
}

async function eliminar(req, res) {
  await usuarioService.eliminar(req.params.rut);
  res.status(204).end();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };