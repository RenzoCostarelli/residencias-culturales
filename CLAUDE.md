# Residencias — Sistema de Selección y Evaluación

## Reglas del proyecto

- **Gestor de paquetes: pnpm, nunca npm.** No ejecutar `npm install`, `npm ci`, `npx`, etc. Usar `pnpm install`, `pnpm add`, `pnpm dlx`, `pnpm exec`, etc. en todo el repo (backend y frontend), incluidos los Dockerfiles.
- El repo ya tiene git inicializado (rama `main`). No hace falta `git init`.
- `pnpm install` con dependencias nativas (bcrypt, prisma, esbuild) requiere `pnpm approve-builds --all` la primera vez, o falla con `ERR_PNPM_IGNORED_BUILDS`. Ya está resuelto vía `pnpm-workspace.yaml` (`allowBuilds`) en `backend/`.

## Levantar el entorno local

```
docker compose up -d --build       # levanta db + backend + frontend (3 contenedores separados)
docker compose exec backend node dist/scripts/seed.js   # crea superadmin + rúbrica inicial (una sola vez)
```

- Frontend: http://localhost:8080 — Backend: http://localhost:4000/health — Postgres: solo accesible dentro de la red `internal` (no expuesto al host).
- Variables de entorno en `.env` (raíz, gitignored); plantilla en `.env.example`.
- Migraciones: `backend/prisma/migrations/`, se aplican solas al arrancar el contenedor backend (`prisma migrate deploy` vía `docker-entrypoint.sh`). Para generar una migración nueva en dev, exponer temporalmente el puerto 5432 de `db` y correr `pnpm exec prisma migrate dev` desde `backend/` apuntando a `localhost`.
- **Prisma es v7** (actualizado 2026-11-06): la URL de conexión vive en `backend/prisma.config.ts` (no en el `datasource` de `schema.prisma`), y `PrismaClient` se instancia con un driver adapter (`@prisma/adapter-pg`) en `backend/src/shared/prisma.ts` — ya no hay motor Rust embebido. El cliente generado vive en `backend/src/generated/prisma` (gitignored/dockerignored, se regenera con `pnpm exec prisma generate`); importar tipos/enums desde `shared/prisma.ts`, no directo de `@prisma/client`.

## Reiniciar el frontend/backend tras un cambio

El frontend/backend en Docker sirven un **build de producción**, no un dev server — editar un `.ts`/`.tsx` en el disco no se refleja solo, hay que reconstruir la imagen:

```
docker compose up -d --build frontend   # solo frontend (~unos segundos)
docker compose up -d --build backend    # solo backend
```

Esto lo podés correr vos directo en la terminal, no hace falta pedírmelo. Para iterar más rápido sin reconstruir Docker en cada cambio de frontend, otra opción es correr `pnpm dev` dentro de `frontend/` (deja el backend de Docker corriendo igual) — abre `http://localhost:5173` con hot-reload instantáneo vía Vite.

## Probar la UI con Playwright

Playwright ya está instalado (`frontend/devDependencies`, Chromium descargado). Para probar visualmente: escribir un script `.mjs` **dentro de `frontend/`** (la resolución de módulos ESM necesita estar bajo `frontend/node_modules`), correrlo con `node archivo.mjs` desde ahí, y revisar los `page.screenshot()` con la herramienta Read. Borrar el script y las capturas al terminar — no se commitean.

El login tiene rate limit (10 intentos / 15 min por IP, `auth.routes.ts`). Si un script de prueba hace varios logins y se traba con 429, reiniciar el contenedor backend (`docker compose restart backend`) resetea el límite en memoria.

## Conceptos del dominio (actualizado 2026-11-12)

- **Evaluadores de grupo** (`GrupoEvaluador`, tabla `grupo_evaluadores`): cualquier usuario, de cualquier rol, puede evaluar — se lo agrega explícitamente a un grupo desde la pestaña "Evaluadores" de ese grupo (`GET/POST/DELETE /grupos/:grupoId/evaluadores`). Los pares de ese grupo solo pueden armarse entre sus miembros.
- **Pares**: manuales (`POST /grupos/:grupoId/pares`, valida que ambos sean evaluadores activos del grupo) o automáticos (`POST /grupos/:grupoId/pares/automaticos`): empareja al azar a los evaluadores del grupo que no integran ya un par activo; si sobra uno queda sin pareja y se informa. La página del evaluador (`/evaluador`) muestra una pestaña por cada grupo donde integra un par activo.
- **Lotes**: ya no se crean a mano eligiendo inscriptos. Se agregan desde un par con los botones **+10 / +20 / +30** (`POST /pares/:parId/lotes`), que toman los próximos inscriptos sin asignar **del mismo grupo del par**, en orden de inscripción (nunca de otro grupo ni sin grupo).
- **Preselección** (`Inscripto.estadoPreseleccion`, `PreseleccionDocumento`): antes de poder evaluar, un integrante del par valida cada documento adjunto (campos `tipoDato: URL`) como CORRECTO / FALTANTE / INCORRECTO con observación opcional, y aprueba o rechaza al inscripto (observación obligatoria si rechaza). Mientras esté `PENDIENTE` o `RECHAZADO` no se puede evaluar. Un admin del grupo puede reabrirla (`PATCH /inscriptos/:id/preseleccion/reabrir`) si todavía no hay evaluaciones enviadas.
- **Evaluaciones sin borrador**: `POST /evaluaciones/:inscriptoId/mia` reemplaza el viejo `PUT .../mia` + `POST .../completar` — se envían todos los puntajes de una sola vez y quedan inmutables (un segundo envío del mismo evaluador da 409). El promedio (`Inscripto.puntajeFinal`) se calcula apenas los dos integrantes del par enviaron la suya.
- **Contraseñas**: nunca se piden al crear un usuario — el backend genera una aleatoria (`generarPasswordAleatoria` en `shared/auth/password.ts`) y la devuelve en claro una única vez (`crearUsuario`/`restablecerPassword`), con `debeCambiarPassword: true`. El frontend muestra esa contraseña en un modal para copiar. Mientras el flag esté activo, `AppShell` muestra un aviso no bloqueante con link a `/cambiar-password` (`POST /auth/cambiar-password`).
- **Agrupación de campos del formulario** (`CampoFormulario.padreId/agrupador/etiquetaCorta`): el Excel reparte preguntas como "2.1 Formación" o "2.2 Experiencia laboral" en columnas sueltas ("Título Secundario", "Experiencia 1 - Lugar", etc.). En el paso de mapeo de la importación, esas columnas se sugieren automáticamente agrupadas bajo el criterio evaluable correspondiente (`importaciones.suggestions.ts`: `normalizarEtiqueta` + `sugerirAgrupacion`, tolerante a variaciones de redacción entre exportaciones del form) y se pueden corregir a mano ahí o después en Rúbrica → Campos identificatorios. El evaluador las ve como párrafos agrupados bajo el criterio padre en el formulario de evaluación.
- **Preselección: siempre manual, el sistema nunca decide por el evaluador.** Ningún estado de documento se precompleta solo (ni "Faltante" cuando no hay archivo subido): las siete preguntas de documentación arrancan en blanco y el botón de aprobar queda deshabilitado hasta elegir las siete a mano (`PreseleccionPage.tsx`).
- **Campos de documento (tipo URL) duplicados entre versiones del form**: distintas hojas del Excel usaron redacciones distintas para la misma foto/DNI/título ("Foto Adjunta" en una hoja vieja vs "1. Foto personal: tipo 4×4..." en la hoja vigente), y como el mapeo de importación compara texto, cada redacción nueva creó un `CampoFormulario` separado en vez de reusar el existente — un inscripto importado con la hoja vieja tenía la respuesta en el campo viejo y aparecía como "No subió archivo" en el nuevo. Se corrigió (2026-11-12) con `backend/src/scripts/fusionar-documentos-duplicados.ts` (`pnpm run fusionar-documentos:prod` dentro del contenedor backend, o `pnpm run fusionar-documentos` en dev): migra las respuestas del campo viejo al vigente cuando falten y desactiva el viejo. Es idempotente; si el formulario cambia de redacción otra vez para estos documentos, hay que sumar el par nuevo a `PARES_DUPLICADOS` y volver a correrlo.
