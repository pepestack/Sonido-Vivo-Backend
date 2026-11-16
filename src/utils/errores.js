function errorHttp(status, mensaje, detalles) {
  const error = new Error(mensaje);
  error.status = status;
  error.detalles = detalles;
  return error;
}
module.exports = { errorHttp };
