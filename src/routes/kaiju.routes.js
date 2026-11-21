// Rutas de KaijuApp (DSY1105), montadas en /api/v1/kaiju.
const express = require("express");
const kaijuController = require("../controllers/kaiju.controller");
const { autenticarKaiju, autorizar } = require("../middlewares/autenticacion");

const router = express.Router();
const usuarios = express.Router();

router.post("/auth/login", kaijuController.iniciarSesion);

// CRUD de usuarios: solo el Administrador de Kaiju, con token de Kaiju.
usuarios.use(autenticarKaiju, autorizar("Administrador"));
usuarios.get("/", kaijuController.listar);
usuarios.get("/:id", kaijuController.obtener);
usuarios.post("/", kaijuController.crear);
usuarios.put("/:id", kaijuController.actualizar);
usuarios.delete("/:id", kaijuController.eliminar);

router.use("/usuarios", usuarios);

module.exports = router;
