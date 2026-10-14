# PracticaDWES
# Sistema de inscripción a talleres y actividades

Práctica de la UD1 (DWES). Aplicación con Node.js, Express y EJS para gestionar los talleres de unas jornadas tecnológicas. Los datos viven en memoria (se pierden al reiniciar el servidor).

- **Autor:** David Delgado Alonso
- **Chat de apoyo con la IA:** `(https://claude.ai/share/7b64a942-080e-4ebe-99d7-63cc7c1804a0)`

## Cómo ejecutarlo

```bash
npm install
npm start        # o: node src/app.js
```

El servidor queda en <http://localhost:3000>. El proyecto usa módulos ES (`"type": "module"` en `package.json`).

## Estructura

```
src/
  app.js      Express: configuración, rutas y manejo de errores
  datos.js    Colecciones en memoria: talleres e inscripciones (3 elementos cada una)
  utils.js    Funciones de lógica, sin req ni res
views/
  partials/   cabecera.ejs y pie.ejs
  talleres.ejs, taller.ejs, inscripcion.ejs, error.ejs
public/css/estilos.css
```

## Cómo se ha realizado cada funcionalidad

### 1. Listado de talleres (`GET /talleres`)
La ruta recorre el array `talleres` y, para cada uno, calcula `plazasRestantes` con `map()` y la función `obtenerPlazasRestantes`. Luego renderiza `talleres.ejs`. Si no hay resultados, la vista muestra un mensaje de lista vacía. La ruta `/` redirige a `/talleres`.

### 2. Filtros por categoría, nivel y disponibilidad
Los parámetros de `req.query` se normalizan (`String(...)`, `trim()`, `toLowerCase()`) y se aplican de forma acumulativa con `filter()`: primero categoría, luego nivel y, si `disponibles=true`, solo los talleres con plazas restantes mayores que 0. Se parte de `talleres` sin modificarlo, así que el catálogo original nunca cambia. Los filtros se pueden combinar y la vista conserva lo que el usuario eligió.

### 3. Cálculo de plazas restantes
`obtenerPlazasRestantes(taller, inscripciones)` (en `utils.js`) filtra las inscripciones de ese taller y devuelve `plazas - número de inscripciones`. No depende de `req` ni de `res`.

### 4. Ficha del taller (`GET /talleres/:id`)
El id se convierte con `parsearId` (solo acepta enteros positivos) y el taller se busca con `find()`. La vista `taller.ejs` muestra tres estados según las plazas restantes:
- más de 1: "N plazas disponibles" con enlace para inscribirse;
- exactamente 1: "Última plaza disponible" con enlace para inscribirse;
- 0: "Completo", sin enlace.

### 5. Formulario de inscripción (`GET /talleres/:id/inscripcion`)
Comprueba el id y que el taller exista, y renderiza `inscripcion.ejs` con valores y errores vacíos.

### 6. Alta de inscripción (`POST /talleres/:id/inscripcion`)
Se registra `express.urlencoded({ extended: false })` antes de las rutas. Todo lo que llega del navegador se trata como no fiable. El orden de comprobaciones es:
1. **Id válido** (`parsearId`): si no lo es, 400. Rechaza `abc`, `1.5`, `-1`, `0x1`, `1e0`.
2. **Taller existente** (`find()`): si no existe, 404.
3. **Normalización** (`normalizarInscripcion`): `trim()` y email en minúsculas. Si no llega body, usa `{}` y no se rompe.
4. **Validación** (`validarInscripcion`): nombre obligatorio de 2 a 40 caracteres y email con formato `texto@dominio.ext` de hasta 100 caracteres.
5. **Plazas**: si `obtenerPlazasRestantes` es 0 o menos, error "El taller está completo".
6. **Duplicados** (`estaInscrito`, con `some()`): el mismo email no puede inscribirse dos veces en el mismo taller, sin distinguir mayúsculas.

### 7. Errores en el formulario
Si hay algún error, se vuelve a renderizar `inscripcion.ejs` con código **400**, los valores normalizados y un mensaje junto a cada campo. Los campos correctos no se pierden. Todo se escribe con `<%= %>` (salida escapada), por lo que un intento de XSS se muestra como texto.

### 8. PRG tras una inscripción correcta
Si todo es válido, se hace `push` en `inscripciones` (id con `siguienteId`, máximo + 1) y se responde `res.redirect(303, "/talleres/:id")`. El navegador hace un GET a la ficha, así que recargar la página no repite el alta.

### 9. Errores y rutas desconocidas
`error.ejs` muestra los errores con su código: 400 (id inválido), 404 (taller o ruta inexistente) y 500 (middleware de error de 4 parámetros, que no enseña la traza al usuario).

### 10. Archivos estáticos
`express.static` sirve `public/`. El CSS se carga desde `/css/estilos.css`.

### Funciones de JavaScript (`src/utils.js`)
Obligatorias: `obtenerPlazasRestantes`, `estaInscrito`, `validarInscripcion`. Adicionales: `parsearId`, `normalizarInscripcion`, `siguienteId`. Métodos usados: `find()`, `filter()`, `map()` y `some()`, además de condicionales, bucles (`for...of` en EJS), conversiones y funciones.

## Llamadas con curl y su equivalente en HTML

Con el servidor arrancado en `localhost:3000`. `-i` muestra el código de estado y las cabeceras.

| # | Funcionalidad | curl | Equivalente en HTML |
|---|---|---|---|
| 1 | Listado | `curl -i http://localhost:3000/talleres` | Enlace "Talleres" de la cabecera |
| 2 | Filtro por categoría | `curl -i "http://localhost:3000/talleres?categoria=web"` | Formulario GET de `/talleres`, campo Categoría |
| 3 | Filtro por nivel | `curl -i "http://localhost:3000/talleres?nivel=avanzado"` | Formulario GET, desplegable Nivel |
| 4 | Filtro por disponibilidad | `curl -i "http://localhost:3000/talleres?disponibles=true"` | Formulario GET, casilla "Solo disponibles" |
| 5 | Filtros combinados | `curl -i "http://localhost:3000/talleres?categoria=web&nivel=avanzado&disponibles=true"` | Formulario GET con los tres campos |
| 6 | Ficha de taller | `curl -i http://localhost:3000/talleres/1` | Enlace con el título de cada taller en el listado |
| 7 | Formulario de inscripción | `curl -i http://localhost:3000/talleres/1/inscripcion` | Botón "Inscribirme" de la ficha |
| 8 | Inscripción correcta (PRG, 303) | `curl -i -X POST -d "nombre=Marta Ruiz&email=marta@example.com" http://localhost:3000/talleres/1/inscripcion` | Formulario POST de `inscripcion.ejs` |
| 9 | Error de validación (400) | `curl -i -X POST -d "nombre=&email=mal" http://localhost:3000/talleres/1/inscripcion` | El mismo formulario, dejando campos vacíos o incorrectos |
| 10 | Email repetido en el taller (400) | Repetir la llamada 8 con el mismo email | El mismo formulario con un email ya inscrito |
| 11 | Taller completo (ficha) | `curl -i http://localhost:3000/talleres/3` tras llenar el taller | Ficha del taller sin botón de inscripción |
| 12 | Inscripción en taller completo (400) | `curl -i -X POST -d "nombre=Otra Persona&email=otra@example.com" http://localhost:3000/talleres/3/inscripcion` | El mismo formulario (si se entra por URL) |
| 13 | Id manipulado (400) | `curl -i http://localhost:3000/talleres/abc` | Escribir la URL en la barra del navegador* |
| 14 | Taller inexistente (404) | `curl -i http://localhost:3000/talleres/999` | Escribir la URL en la barra del navegador* |
| 15 | Ruta desconocida (404) | `curl -i http://localhost:3000/nada` | Escribir la URL en la barra del navegador* |
| 16 | Archivo estático | `curl -i http://localhost:3000/css/estilos.css` | Se carga con `<link>` en la cabecera de todas las páginas |

\* Una URL manipulada no puede generarse desde un enlace de la propia aplicación, porque la aplicación solo genera ids válidos. Se prueba escribiéndola a mano en el navegador.

### Cómo comprobar el PRG con curl
La llamada 8 debe responder `303 See Other` con `Location: /talleres/1`. Para seguir la redirección:

```bash
curl -i -L -X POST -d "nombre=Marta Ruiz&email=marta2@example.com" http://localhost:3000/talleres/2/inscripcion
```

### Cómo llenar un taller para probar "Completo"
El taller 3 tiene 10 plazas y ninguna ocupada al arrancar:

```bash
for i in $(seq 1 10); do
  curl -s -o /dev/null -X POST -d "nombre=Persona $i&email=p$i@example.com" http://localhost:3000/talleres/3/inscripcion
done
```

## Uso de la IA
Se ha usado como herramienta de consulta y apoyo, y el enlace al chat está al principio de este documento.
