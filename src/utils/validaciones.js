const correosPermitidos = ["duoc.cl", "profesor.duoc.cl", "gmail.com"];

function rutValido(rut) {
  if (!/^[0-9]+[0-9K]$/.test(rut) || rut.length < 7 || rut.length > 9)
    return false;
  const cuerpo = rut.slice(0, -1);
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += cuerpo[i] * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  const dv = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === rut.slice(-1);
}

function fechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const date = new Date(fecha);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === fecha &&
    date <= new Date()
  );
}

function validarRegistro(d) {
  const errores = {};
  if (!rutValido(d.rut))
    errores.rut = "RUN inválido, ingrésalo sin puntos ni guion";
  if (!d.nombre || d.nombre.length > 50)
    errores.nombre = "Nombre requerido (máx. 50)";
  if (!d.apellido || d.apellido.length > 100)
    errores.apellido = "Apellido requerido (máx. 100)";
  const correoOk =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo) && d.correo.length <= 100;
  if (!correoOk || !correosPermitidos.includes(d.correo.split("@")[1])) {
    errores.correo =
      "Correo inválido (solo @duoc.cl, @profesor.duoc.cl o @gmail.com)";
  }
  if (d.contrasena.length < 4 || d.contrasena.length > 10)
    errores.contrasena = "La contraseña debe tener entre 4 y 10 caracteres";
  if (d.fechaNacimiento && !fechaValida(d.fechaNacimiento))
    errores.fechaNacimiento = "Fecha inválida";
  if (!d.region || d.region.length > 100)
    errores.region = "Selecciona una región";
  if (!d.comuna || d.comuna.length > 100)
    errores.comuna = "Selecciona una comuna";
  if (!d.direccion || d.direccion.length > 300)
    errores.direccion = "Dirección requerida (máx. 300)";
  return errores;
}

module.exports = { validarRegistro };
