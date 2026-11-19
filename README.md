# Top Walker

Catálogo público de calzados. Entorno local de desarrollo con Next.js (App Router), NestJS y PostgreSQL, conectado mediante Prisma.

## Inicio

Requisitos: Docker Desktop iniciado en modo contenedores Linux y Docker Compose.

1. Copiar `.env.example` a `.env` y sustituir la contraseña de ejemplo por una contraseña aleatoria. Usar caracteres alfanuméricos para evitar errores de codificación en DATABASE_URL.
2. Ejecutar desde esta carpeta:

```sh
docker compose up --build -d
docker compose ps
docker compose exec backend npm run db:seed
```

- Aplicación: http://localhost:3000
- Catálogo: http://localhost:3000/catalogo
- API: http://localhost:3001/api/health
- Verificación completa frontend → NestJS → PostgreSQL: http://localhost:3000/api/health

La semilla es explícita e idempotente: crea únicamente registros demostrativos ausentes, sin sobrescribir modificaciones. No se ejecuta automáticamente al reiniciar. Las migraciones versionadas se aplican con `prisma migrate deploy` antes de iniciar NestJS, una vez que PostgreSQL está saludable.

## Servicios y red

| Contenedor | Función | Acceso |
| --- | --- | --- |
| topwalker-frontend | Next.js, App Router, Tailwind | 127.0.0.1:3000 |
| topwalker-backend | API REST NestJS + Prisma | 127.0.0.1:3001 |
| topwalker-db | PostgreSQL | Solo red interna, db:5432 |

`topwalker_data` es una red interna de Docker. Solo backend y db pertenecen a ella. `topwalker_app` comunica frontend y backend. PostgreSQL persiste en `topwalker_postgres_data`. Las credenciales se inyectan desde `.env`, que está ignorado por Git. Ninguna credencial se entrega al navegador.

El servidor Next.js usa `http://backend:3001/api`. Las peticiones del navegador a `/api/catalog/*` se reenvían a NestJS desde Next.js. No se usa `localhost` entre contenedores. Los healthchecks locales de cada servicio sí usan loopback intencionadamente.

## Desarrollo y mantenimiento

```sh
docker compose logs --tail=100 backend frontend
docker compose exec backend npx prisma migrate status
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
docker compose restart backend frontend
docker compose down
```

`down` conserva el volumen. No utilizar `down -v` ni limpieza de volúmenes. Este proyecto usa el nombre Compose `topwalker`; no opera sobre recursos de otros proyectos.

Los directorios `frontend/src`, `frontend/public`, `backend/src` y `backend/prisma` se montan para desarrollo. Next.js observa cambios con polling; TypeScript recompila NestJS y Node reinicia el proceso al cambiar el resultado. Cambios de dependencias, configuración o Prisma requieren reconstruir la imagen con el comando principal. Una migración nueva se revisa antes de aplicarla; no se ejecuta `migrate dev` automáticamente.

## Validación

```sh
docker compose exec backend npm run lint
docker compose exec backend npm run typecheck
docker compose exec backend npm run build
docker compose exec backend npm run test:integration
docker compose exec frontend npm run lint
docker compose exec frontend npm run typecheck
docker compose exec frontend node scripts/check-build.mjs
```

La compilación de Next.js se valida en una carpeta temporal del contenedor con `NODE_ENV=production`, sin sobrescribir la caché del servidor de desarrollo.

Pruebas de navegador (Microsoft Edge instalado en Windows):

```sh
cd frontend
npm ci
npm run test:e2e
```

Playwright recorre inicio, catálogo, filtros y selección de talla/color en 360, 768 y 1920 píxeles; guarda capturas en `frontend/test-results/`. La aplicación sigue ejecutándose en Docker. Esperar a que termine cualquier reconstrucción antes de probar: `docker compose up -d --wait`.

Prueba de persistencia sin eliminar volúmenes ni modificar registros:

```sh
docker compose exec backend node test/persistence.mjs capture
docker compose up -d --force-recreate db
docker compose up -d --wait
docker compose exec backend node test/persistence.mjs verify
```

La captura se guarda temporalmente en el contenedor backend; no recrearlo entre `capture` y `verify`.

Las pruebas y resultados efectivos se registran en `PROGRESS.md`. El objetivo RNF-02 (50 productos / 10 Mbps) y la disponibilidad mensual requieren pruebas específicas posteriores; un healthcheck no los acredita.

## Decisiones y alcance

Diseño y reglas confirmadas: [modelo de datos](documento%20del%20proyecto/modelo-datos.md). Incluye relaciones, restricciones, galería principal y responsabilidades de la futura escritura administrativa. Pruebas de invariantes en PostgreSQL: `docker compose exec backend node --test test/model.test.mjs`.

- Disponibilidad booleana por **talla y color**, solicitada por el usuario; sin cantidades ni descuentos automáticos.
- Precio único por modelo en bolivianos, mayor que cero.
- Publicación manual; productos retirados excluidos de listados y detalle públicos.
- Galería ordenada por modelo; posición 0 como fotografía principal.
- Búsqueda por nombre, categoría y talla se combinan; la talla exige alguna combinación disponible.
- Datos de demostración identificados en pantalla; imágenes de las referencias visuales facilitadas, sin presentarlas como fotografías comerciales reales.
- El documento fuente es `documento del proyecto/Top_Walker.docx`, conservado sin modificaciones.
- Las referencias muestran filtros adicionales y datos de contacto ilustrativos; se implementan los requisitos formales y no se copian esos datos.
- Autenticación y gestión administrativa quedan para la siguiente etapa. No hay endpoints públicos de escritura.
- WhatsApp y Cloudinary requieren datos reales antes de habilitar integración comercial.

## Versiones

Node.js 22 (imagen Debian Bookworm), PostgreSQL 17, Next.js 16.4.6, NestJS 11.2.11, Prisma 6.19.3, TypeScript 5.9.3 y Tailwind CSS 4.3.5. `package-lock.json` fija las dependencias transitivas y Docker instala con `npm ci`. Se conserva Prisma 6 con su cliente y CLI de la misma versión; no se mezcla la API de adaptadores de Prisma 7/8.

Compatibilidad revisada en las fuentes oficiales: [Next.js](https://nextjs.org/docs/app/getting-started/installation), [NestJS](https://docs.nestjs.com/faq/versions), [Prisma](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/database-drivers). Las versiones concretas se contrastaron con el registro npm.

Override acotado: `@prisma/config` utiliza `deepmerge-ts` 8.0.0 para corregir [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). Verificados generación del cliente, migraciones, compilación y consultas con esta combinación. React y React DOM resueltos a 19.3.1 por el lockfile.

Este Compose es de desarrollo local, con recarga automática y puertos limitados a loopback. Un despliegue público requerirá imágenes de producción, HTTPS y configuración de dominio y secretos.
