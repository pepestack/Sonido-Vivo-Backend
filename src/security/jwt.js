const jwt = require("jsonwebtoken");
const config = require("../config/env");

const OPCIONES = {
  algorithm: "HS256",
  issuer: "sonido-vivo-api",
  audience: "sonido-vivo-web",
};

function firmarToken(usuario) {
  return jwt.sign({ rol: usuario.rol }, config.jwt.secreto, {
    algorithm: OPCIONES.algorithm,
    subject: String(usuario.id),
    expiresIn: config.jwt.expira,
    issuer: OPCIONES.issuer,
    audience: OPCIONES.audience,
  });
}

// Lanza TokenExpiredError o JsonWebTokenError si el token no es válido.
function verificarToken(token) {
  return jwt.verify(token, config.jwt.secreto, {
    algorithms: [OPCIONES.algorithm],
    issuer: OPCIONES.issuer,
    audience: OPCIONES.audience,
  });
}

module.exports = { firmarToken, verificarToken };
