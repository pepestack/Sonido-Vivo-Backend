const jwt = require("jsonwebtoken");
const config = require("../config/env");

const OPCIONES = {
  algorithm: "HS256",
  issuer: "sonido-vivo-api",
  audience: "sonido-vivo-web",
};

// Audiencia de los tokens de KaijuApp: un token de Sonido Vivo no sirve en Kaiju y al revés.
const AUDIENCIA_KAIJU = "kaiju-app";

function firmarToken(usuario, audience = OPCIONES.audience) {
  return jwt.sign({ rol: usuario.rol }, config.jwt.secreto, {
    algorithm: OPCIONES.algorithm,
    subject: String(usuario.id),
    expiresIn: config.jwt.expira,
    issuer: OPCIONES.issuer,
    audience,
  });
}

// Lanza TokenExpiredError o JsonWebTokenError si el token no es válido.
function verificarToken(token, audience = OPCIONES.audience) {
  return jwt.verify(token, config.jwt.secreto, {
    algorithms: [OPCIONES.algorithm],
    issuer: OPCIONES.issuer,
    audience,
  });
}

module.exports = { firmarToken, verificarToken, AUDIENCIA_KAIJU };
