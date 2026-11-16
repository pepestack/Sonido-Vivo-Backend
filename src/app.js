const express = require("express");
const cors = require("cors");
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
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
