const { verificarToken } = require("../security/jwt");
const usuarios = require("../repositories/usuario.repository");
const { errorHttp } = require("../utils/errores");

// Exige un JWT válido en "Authorization: Bearer <token>".
// Responde 401 si falta, está alterado, venció o la cuenta ya no está activa.
async function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization ?? "").split(" ");

  if (tipo !== "Bearer" || !token)
    return next(errorHttp(401, "Debes iniciar sesión"));

  let payload;
  try {
    payload = verificarToken(token);
  } catch (error) {
    const mensaje =
      error.name === "TokenExpiredError"
        ? "La sesión expiró, inicia sesión nuevamente"
        : "Token inválido";
    return next(errorHttp(401, mensaje));
  }

  // El token sigue siendo válido aunque el usuario se desactive o cambie de rol,
  // por eso se consulta su estado y rol actuales en la base de datos.
  const usuario = await usuarios.buscarPorId(Number(payload.sub));
  if (!usuario || !usuario.activo)
    return next(errorHttp(401, "Tu cuenta no está activa"));

  req.usuario = { id: usuario.id, rol: usuario.rol };
  next();
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
