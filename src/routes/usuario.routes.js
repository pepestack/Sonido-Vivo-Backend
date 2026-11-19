const router = require("express").Router();
const usuarioController = require("../controllers/usuario.controller");
const { autenticar, autorizar } = require("../middlewares/autenticacion");

router.use(autenticar, autorizar("Administrador"));

router.get("/", usuarioController.listar);
router.get("/:id", usuarioController.obtener);
router.post("/", usuarioController.crear);
router.put("/:id", usuarioController.actualizar);
router.delete("/:id", usuarioController.eliminar);

module.exports = router;
