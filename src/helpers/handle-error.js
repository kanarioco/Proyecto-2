//! --- helper para manejar errores en los catch d enuestras funciones del controlador

const setError = (code, message) => {
  const error = new Error();
  error.code = code;
  error.message = message;
  return error;
};

module.exports = setError;
