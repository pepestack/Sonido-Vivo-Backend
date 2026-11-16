const router = require("express").Router();
const authController = require("../controllers/auth.controller");

router.post("/login", authController.iniciarSesion);

module.exports = router;
