import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { talleres, inscripciones } from "./datos.js";
import {
  parsearId,
  obtenerPlazasRestantes,
  estaInscrito,
  normalizarInscripcion,
  validarInscripcion,
  siguienteId
} from "./utils.js";

const app = express();
const PORT = 3000;

// Rutas absolutas: funcionan aunque arranques el servidor desde otra carpeta
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(__dirname, "..");

app.set("view engine", "ejs");
app.set("views", path.join(raiz, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(raiz, "public")));

app.get("/", (req, res) => {
  res.redirect("/talleres");
});

app.get("/talleres", (req, res) => {
  const categoria = String(req.query.categoria ?? "")
    .trim()
    .toLowerCase();

  const nivel = String(req.query.nivel ?? "")
    .trim()
    .toLowerCase();

  const disponibles = req.query.disponibles === "true";

  let resultado = talleres;

  if (categoria) {
    resultado = resultado.filter((taller) => {
      return taller.categoria.toLowerCase() === categoria;
    });
  }

  if (nivel) {
    resultado = resultado.filter((taller) => {
      return taller.nivel.toLowerCase() === nivel;
    });
  }

  if (disponibles) {
    resultado = resultado.filter((taller) => {
      return obtenerPlazasRestantes(taller, inscripciones) > 0;
    });
  }

  const datos = resultado.map((taller) => {
    return {
      ...taller,
      plazasRestantes: obtenerPlazasRestantes(taller, inscripciones)
    };
  });

  res.render("talleres", {
    talleres: datos,
    filtros: {
      categoria,
      nivel,
      disponibles
    }
  });
});

app.get("/talleres/:id", (req, res) => {
  const id = parsearId(req.params.id);

  if (id === null) {
    return res.status(400).render("error", {
      mensaje: "Identificador no válido"
    });
  }

  const taller = talleres.find((taller) => taller.id === id);

  if (!taller) {
    return res.status(404).render("error", {
      mensaje: "Taller no encontrado"
    });
  }

  const plazasRestantes = obtenerPlazasRestantes(taller, inscripciones);

  res.render("taller", {
    taller,
    plazasRestantes
  });
});

app.get("/talleres/:id/inscripcion", (req, res) => {
  const id = parsearId(req.params.id);

  if (id === null) {
    return res.status(400).render("error", {
      mensaje: "Identificador no válido"
    });
  }

  const taller = talleres.find((taller) => taller.id === id);

  if (!taller) {
    return res.status(404).render("error", {
      mensaje: "Taller no encontrado"
    });
  }

  res.render("inscripcion", {
    taller,
    valores: {
      nombre: "",
      email: ""
    },
    errores: {}
  });
});

app.post("/talleres/:id/inscripcion", (req, res) => {
  const id = parsearId(req.params.id);

  if (id === null) {
    return res.status(400).render("error", {
      mensaje: "Identificador no válido"
    });
  }

  const taller = talleres.find((taller) => taller.id === id);

  if (!taller) {
    return res.status(404).render("error", {
      mensaje: "Taller no encontrado"
    });
  }

  const datos = normalizarInscripcion(req.body);
  const errores = validarInscripcion(datos);

  if (obtenerPlazasRestantes(taller, inscripciones) <= 0) {
    errores.general = "El taller está completo";
  }

  // Solo tiene sentido buscar duplicados si el email es válido
  if (!errores.email && estaInscrito(id, datos.email, inscripciones)) {
    errores.email = "Ya hay una inscripción con ese email";
  }

  if (Object.keys(errores).length > 0) {
    return res.status(400).render("inscripcion", {
      taller,
      valores: datos,
      errores
    });
  }

  inscripciones.push({
    id: siguienteId(inscripciones),
    tallerId: id,
    nombre: datos.nombre,
    email: datos.email
  });

  // PRG: tras el POST correcto redirigimos a un GET
  res.redirect(303, "/talleres/" + id);
});

// 404: después de todas las rutas válidas
app.use((req, res) => {
  res.status(404).render("error", {
    mensaje: "Página no encontrada"
  });
});

// Middleware de error (4 parámetros): evita enseñar la traza al usuario
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).render("error", {
    mensaje: "Error interno del servidor"
  });
});

app.listen(PORT, () => {
  console.log("Servidor funcionando en http://localhost:" + PORT);
});