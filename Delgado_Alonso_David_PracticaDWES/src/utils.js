export function obtenerPlazasRestantes(taller, inscripciones) {
  if (!taller) {
    return 0;
  }

  const apuntados = inscripciones.filter(
    (inscripcion) => inscripcion.tallerId === taller.id
  );

  return taller.plazas - apuntados.length;
}

export function estaInscrito(tallerId, email, inscripciones) {
  const correo = String(email ?? "").trim().toLowerCase();

  return inscripciones.some((inscripcion) => {
    return inscripcion.ta// Convierte el id que llega por la URL en un número entero positivo.
// Devuelve null si no es válido (abc, 1.5, -1, 0x1, 1e0...).
export function parsearId(texto) {
  const limpio = String(texto ?? "").trim();

  // Solo dígitos: así Number() no puede interpretar "0x1" o "1e0"
  if (!/^\d+$/.test(limpio)) {
    return null;
  }

  const id = Number(limpio);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export function obtenerPlazasRestantes(taller, inscripciones) {
  if (!taller) {
    return 0;
  }

  const apuntados = inscripciones.filter(
    (inscripcion) => inscripcion.tallerId === taller.id
  );

  return taller.plazas - apuntados.length;
}

export function estaInscrito(tallerId, email, inscripciones) {
  const correo = String(email ?? "").trim().toLowerCase();

  return inscripciones.some((inscripcion) => {
    return (
      inscripcion.tallerId === tallerId &&
      inscripcion.email.toLowerCase() === correo
    );
  });
}

// Limpia lo que envía el navegador. Si no llega body (por ejemplo, una
// petición JSON), req.body es undefined: por eso se usa ?? {}
export function normalizarInscripcion(body) {
  const entrada = body ?? {};

  return {
    nombre: String(entrada.nombre ?? "").trim(),
    email: String(entrada.email ?? "").trim().toLowerCase()
  };
}

export function validarInscripcion(datos) {
  const errores = {};

  const nombre = String(datos.nombre ?? "").trim();
  const email = String(datos.email ?? "").trim();

  if (nombre === "") {
    errores.nombre = "Tienes que poner el nombre";
  } else if (nombre.length < 2) {
    errores.nombre = "El nombre debe tener al menos 2 caracteres";
  } else if (nombre.length > 40) {
    errores.nombre = "El nombre es demasiado largo (máximo 40)";
  }

  // texto@dominio.ext, sin espacios y con una sola arroba
  const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (email === "") {
    errores.email = "Tienes que poner el email";
  } else if (email.length > 100) {
    errores.email = "El email es demasiado largo (máximo 100)";
  } else if (!formatoEmail.test(email)) {
    errores.email = "El email no es correcto";
  }

  return errores;
}

// Evita repetir ids (length + 1 puede repetirlos si algún día se borra algo)
export function siguienteId(lista) {
  if (lista.length === 0) {
    return 1;
  }

  return Math.max(...lista.map((elemento) => elemento.id)) + 1;
}llerId === tallerId &&
      inscripcion.email === correo;
  });
}

export function validarInscripcion(datos) {
  const errores = {};

  const nombre = String(datos.nombre ?? "").trim();
  const email = String(datos.email ?? "").trim();

  if (nombre === "") {
    errores.nombre = "Tienes que poner el nombre";
  }

  if (nombre.length > 40) {
    errores.nombre = "El nombre es demasiado largo";
  }

  if (email === "") {
    errores.email = "Tienes que poner el email";
  }

  if (email && (!email.includes("@") || !email.includes("."))) {
    errores.email = "El email no es correcto";
  }

  return errores;
}
