const authService = require("../services/auth.service");

async function iniciarSesion(req, res) {
  const resultado = await authService.iniciarSesion(req.body);
  res.status(200).json(resultado);
}

async function registrarUsuario(req, res) {
  const resultado = await authService.registrarUsuario(req.body);
  res.status(201).json(resultado);
}

module.exports = { iniciarSesion, registrarUsuario };
