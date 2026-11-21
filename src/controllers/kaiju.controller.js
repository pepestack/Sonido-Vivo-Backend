const kaijuService = require("../services/kaiju.service");

async function iniciarSesion(req, res) {
  res.status(200).json(await kaijuService.iniciarSesion(req.body));
}

async function listar(req, res) {
  res.status(200).json(await kaijuService.listar());
}

async function obtener(req, res) {
  res.status(200).json(await kaijuService.obtener(req.params.id));
}

async function crear(req, res) {
  res.status(201).json(await kaijuService.crear(req.body));
}

async function actualizar(req, res) {
  res
    .status(200)
    .json(await kaijuService.actualizar(req.params.id, req.body, req.usuario));
}

async function eliminar(req, res) {
  await kaijuService.eliminar(req.params.id, req.usuario);
  res.status(204).end();
}

module.exports = { iniciarSesion, listar, obtener, crear, actualizar, eliminar };
