const { verificarToken } = require("../security/jwt");
const { errorHttp } = require("../utils/errores");

// Exige un JWT válido en "Authorization: Bearer <token>".
// Responde 401 si falta, está alterado o venció.
function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization ?? "").split(" ");

  if (tipo !== "Bearer" || !token)
    return next(errorHttp(401, "Debes iniciar sesión"));

  try {
    const payload = verificarToken(token);
    req.usuario = { id: Number(payload.sub), rol: payload.rol };
    next();
  } catch (error) {
    const mensaje =
      error.name === "TokenExpiredError"
        ? "La sesión expiró, inicia sesión nuevamente"
        : "Token inválido";
    next(errorHttp(401, mensaje));
  }
}

// Exige que el usuario autenticado tenga uno de los roles indicados.
// Responde 403 si el rol no está permitido. Usar después de autenticar.
function autorizar(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol))
      return next(errorHttp(403, "No tienes permiso para esta acción"));
    next();
  };
}

module.exports = { autenticar, autorizar };
