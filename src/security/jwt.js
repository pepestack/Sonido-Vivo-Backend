const jwt = require("jsonwebtoken");
const config = require("../config/env");

function firmarToken(usuario) {
  return jwt.sign({ rol: usuario.rol }, config.jwt.secreto, {
    algorithm: "HS256",
    subject: String(usuario.id),
    expiresIn: config.jwt.expira,
    issuer: "sonido-vivo-api",
    audience: "sonido-vivo-web",
  });
}

module.exports = { firmarToken };
