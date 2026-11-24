const router = require("express").Router();
const productoController = require("../controllers/producto.controller");
const { autenticar, autorizar } = require("../middlewares/autenticacion");

router.get("/", productoController.listar);
router.get("/:id", productoController.obtener);

const gestionar = [autenticar, autorizar("Administrador", "Vendedor")];

router.post("/", gestionar, productoController.crear);
router.put("/:id", gestionar, productoController.actualizar);
router.delete("/:id", autenticar, autorizar("Administrador"), productoController.eliminar);

module.exports = router;
