const authService = require("../services/auth.service");

async function iniciarSesion(req, res) {
  const resultado = await authService.iniciarSesion(req.body);
  res.status(200).json(resultado);
}

async function registrarUsuario(req, res) {
  const resultado = await authService.registrarUsuario(req.body);
  res.status(201).json(resultado);
}

// El middleware autenticar ya validó el token y consultó la BD: si la cuenta
// se desactivó respondió 401, y req.usuario trae el rol actual.
async function obtenerSesion(req, res) {
  res.status(200).json({ usuario: req.usuario });
}

module.exports = { iniciarSesion, registrarUsuario, obtenerSesion };
