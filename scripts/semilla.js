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

// Mismos ids que DatosDePrueba.usuarios de KaijuApp: el historial del teléfono
// guarda el id del usuario en cada movimiento.
const kaijuUsuarios = [
  { id: 1, nombre: "Alejandro Carrasco", correo: "admin.kaiju@duoc.cl", rol: "Administrador" },
  { id: 2, nombre: "Esteban Hernandez", correo: "encargado.kaiju@duoc.cl", rol: "Encargado de inventario" },
  { id: 3, nombre: "Ignacia Diaz", correo: "vendedor.kaiju@duoc.cl", rol: "Vendedor" },
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
  for (const u of kaijuUsuarios) {
    const hash = await bcrypt.hash("1234", 10);
    await pool.query(
      `INSERT INTO kaiju_usuarios (id, nombre, correo, contrasena_hash, rol_id)
       VALUES ($1, $2, $3, $4, (SELECT id FROM kaiju_roles WHERE nombre = $5))
       ON CONFLICT DO NOTHING`,
      [u.id, u.nombre, u.correo, hash, u.rol],
    );
  }
  // Los ids se insertaron a mano: se mueve la secuencia para que los nuevos no choquen.
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('kaiju_usuarios', 'id'),
                   (SELECT MAX(id) FROM kaiju_usuarios))`,
  );
  console.log("Contraseña:1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
