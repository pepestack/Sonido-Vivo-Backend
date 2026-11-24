const express = require("express");
const cors = require("cors");
const authRoutes = require('./routes/auth.routes');
const config = require("./config/env");
const usuarioRoutes = require("./routes/usuario.routes");
const kaijuRoutes = require("./routes/kaiju.routes");
const productoRoutes = require("./routes/producto.routes");
const swaggerUi = require("swagger-ui-express");
const openapi = require("./docs/openapi");

const app = express();

app.use(cors({ origin: config.corsOrigen.split(",").map((o) => o.trim()) }));
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use("/api/v1/usuarios", usuarioRoutes);
app.use("/api/v1/productos", productoRoutes);
app.use("/api/v1/kaiju", kaijuRoutes);
app.get("/api-docs.json", (req, res) => res.json(openapi));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapi, { swaggerOptions: { persistAuthorization: true } }),
);
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? "Error interno del servidor" : err.message,
    detalles: err.detalles,
  });
});

module.exports = app;
