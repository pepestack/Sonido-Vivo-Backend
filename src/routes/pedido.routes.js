const router = require("express").Router();
const pedidoController = require("../controllers/pedido.controller");
const { autenticar, autorizar } = require("../middlewares/autenticacion");

function autenticarSiHayToken(req, res, next) {
  if (req.headers.authorization === undefined) return next();
  return autenticar(req, res, next);
}

const consultar = [autenticar, autorizar("Cliente", "Administrador", "Vendedor")];

router.post("/", autenticarSiHayToken, pedidoController.crear);
router.get("/", consultar, pedidoController.listar);
router.get("/:id", consultar, pedidoController.obtener);
router.put("/:id", autenticar, autorizar("Administrador", "Vendedor"), pedidoController.actualizar);
router.delete("/:id", autenticar, autorizar("Administrador"), pedidoController.cancelar);

module.exports = router;
