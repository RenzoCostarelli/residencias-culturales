# Residencias — Sistema de Selección y Evaluación

## Reglas del proyecto

- **Gestor de paquetes: pnpm, nunca npm.** No ejecutar `npm install`, `npm ci`, `npx`, etc. Usar `pnpm install`, `pnpm add`, `pnpm dlx`, `pnpm exec`, etc. en todo el repo (backend y frontend), incluidos los Dockerfiles.
- **Sin git todavía** (decisión explícita del usuario, 2026-11-04): no inicializar repositorio hasta que lo pida.
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
