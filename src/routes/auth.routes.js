const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const { autenticar } = require("../middlewares/autenticacion");

router.post("/login", authController.iniciarSesion);
router.post("/registro", authController.registrarUsuario);
router.get("/sesion", autenticar, authController.obtenerSesion);

module.exports = router;
