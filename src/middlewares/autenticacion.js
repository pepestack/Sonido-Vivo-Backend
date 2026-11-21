const { verificarToken, AUDIENCIA_KAIJU } = require("../security/jwt");
const usuarios = require("../repositories/usuario.repository");
const kaijuUsuarios = require("../repositories/kaiju-usuario.repository");
const { errorHttp } = require("../utils/errores");

// Crea un middleware que exige un JWT válido en "Authorization: Bearer <token>"
// emitido para la audiencia indicada, y busca al usuario en el repositorio dado.
// Responde 401 si falta, está alterado, venció o la cuenta ya no está activa.
function crearAutenticador(audience, repositorio) {
  return async function (req, res, next) {
    const [tipo, token] = (req.headers.authorization ?? "").split(" ");

    if (tipo !== "Bearer" || !token)
      return next(errorHttp(401, "Debes iniciar sesión"));

    let payload;
    try {
      payload = verificarToken(token, audience);
    } catch (error) {
      const mensaje =
        error.name === "TokenExpiredError"
          ? "La sesión expiró, inicia sesión nuevamente"
          : "Token inválido";
      return next(errorHttp(401, mensaje));
    }

    // El token sigue siendo válido aunque el usuario se desactive o cambie de rol,
    // por eso se consulta su estado y rol actuales en la base de datos.
    const usuario = await repositorio.buscarPorId(Number(payload.sub));
    if (!usuario || !usuario.activo)
      return next(errorHttp(401, "Tu cuenta no está activa"));

    req.usuario = { id: usuario.id, rol: usuario.rol };
    next();
  };
}

// Sonido Vivo (audiencia por defecto) y KaijuApp.
const autenticar = crearAutenticador(undefined, usuarios);
const autenticarKaiju = crearAutenticador(AUDIENCIA_KAIJU, kaijuUsuarios);

// Exige que el usuario autenticado tenga uno de los roles indicados.
// Responde 403 si el rol no está permitido. Usar después de autenticar.
function autorizar(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol))
      return next(errorHttp(403, "No tienes permiso para esta acción"));
    next();
  };
}

module.exports = { autenticar, autenticarKaiju, autorizar };
