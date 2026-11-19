const router = require("express").Router();
const usuarioController = require("../controllers/usuario.controller");
const { autenticar, autorizar } = require("../middlewares/autenticacion");

router.use(autenticar, autorizar("Administrador"));

router.get("/", usuarioController.listar);
router.get("/:rut", usuarioController.obtener);
router.post("/", usuarioController.crear);
router.put("/:rut", usuarioController.actualizar);
router.delete("/:rut", usuarioController.eliminar);

module.exports = router;
