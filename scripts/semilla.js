const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

const usuarios = [
  {
    rut: "111111111",
    nombre: "Dueño",
    apellido: "Sonido Vivo",
    correo: "admin@duoc.cl",
    comuna: "Viña del Mar",
    rol: "Administrador",
  },
  {
    rut: "222222222",
    nombre: "Sebastian",
    apellido: "Navarro",
    correo: "seba@duoc.cl",
    comuna: "Viña del Mar",
    rol: "Vendedor",
  },
  {
    rut: "333333333",
    nombre: "Jose",
    apellido: "Calderon",
    correo: "jose.c@duoc.cl",
    comuna: "Valparaíso",
    rol: "Vendedor",
  },
  {
    rut: "444444444",
    nombre: "Sebastian",
    apellido: "Apablaza",
    correo: "seba.a@duoc.cl",
    comuna: "Quilpué",
    rol: "Vendedor",
  },
  {
    rut: "555555555",
    nombre: "Camila",
    apellido: "Rojas",
    correo: "cliente@gmail.com",
    comuna: "Concón",
    rol: "Cliente",
  },
];

async function main() {
  for (const u of usuarios) {
    const hash = await bcrypt.hash("1234", 10);
    await pool.query(
      `INSERT INTO usuarios (rut, nombre, apellido, correo, contrasena_hash, region, comuna, direccion, rol_id)
       VALUES ($1, $2, $3, $4, $5, 'Región de Valparaíso', $6, $6, (SELECT id FROM roles WHERE nombre = $7))
       ON CONFLICT DO NOTHING`,
      [u.rut, u.nombre, u.apellido, u.correo, hash, u.comuna, u.rol],
    );
  }
  console.log("Contraseña:1234");
  await pool.end();
}

main();
