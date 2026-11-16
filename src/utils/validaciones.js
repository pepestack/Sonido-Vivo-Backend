const correosPermitidos = ["duoc.cl", "profesor.duoc.cl", "gmail.com"];

function rutValido(rut) {
  if (typeof rut !== "string") return false;
  if (!/^[0-9]+[0-9K]$/.test(rut) || rut.length < 7 || rut.length > 9)
    return false;

  const cuerpo = rut.slice(0, -1);
  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  const dv = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);

  return dv === rut.slice(-1);
}

function fechaValida(fecha) {
  if (typeof fecha !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;

  const date = new Date(fecha);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === fecha &&
    date <= new Date()
  );
}

function textoValido(valor, maximo) {
  return (
    typeof valor === "string" &&
    valor.trim().length > 0 &&
    valor.length <= maximo
  );
}

function validarRegistro(d = {}) {
  const errores = {};

  if (!rutValido(d.rut))
    errores.rut = "RUN inválido, ingrésalo sin puntos ni guion";

  if (!textoValido(d.nombre, 50))
    errores.nombre = "Nombre requerido (máx. 50)";

  if (!textoValido(d.apellido, 100))
    errores.apellido = "Apellido requerido (máx. 100)";

  const correoOk =
    typeof d.correo === "string" &&
    d.correo.length <= 100 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo) &&
    correosPermitidos.includes(d.correo.split("@")[1]);

  if (!correoOk)
    errores.correo =
      "Correo inválido (solo @duoc.cl, @profesor.duoc.cl o @gmail.com)";

  if (
    typeof d.contrasena !== "string" ||
    d.contrasena.length < 4 ||
    d.contrasena.length > 10
  )
    errores.contrasena = "La contraseña debe tener entre 4 y 10 caracteres";

  if (
    d.fechaNacimiento !== undefined &&
    d.fechaNacimiento !== null &&
    d.fechaNacimiento !== "" &&
    !fechaValida(d.fechaNacimiento)
  )
    errores.fechaNacimiento = "Fecha inválida";

  if (!textoValido(d.region, 100))
    errores.region = "Selecciona una región";

  if (!textoValido(d.comuna, 100))
    errores.comuna = "Selecciona una comuna";

  if (!textoValido(d.direccion, 300))
    errores.direccion = "Dirección requerida (máx. 300)";

  return errores;
}

module.exports = { validarRegistro };
