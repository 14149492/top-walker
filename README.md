# Top Walker

Catálogo público y administración de calzados. Entorno local de desarrollo con Next.js (App Router), NestJS y PostgreSQL, conectado mediante Prisma.

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
- Inicio de sesión administrativo: http://localhost:3000/admin/login
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

El servidor Next.js usa `http://backend:3001/api`. Las peticiones del navegador a `/api/catalog/*`, `/api/auth/*`, `/api/admin/*` y `/api/media/*` se reenvían a NestJS desde Next.js, manteniendo cookies del mismo origen. No se usa `localhost` entre contenedores. Los healthchecks locales de cada servicio sí usan loopback intencionadamente.

## Administración: Sprint 1 y Sprint 2

Rutas: `/admin/login`, `/admin`, `/admin/productos`, `/admin/productos/nuevo` y `/admin/productos/[id]/editar`.

- HU-06: acceso por usuario o correo, sesión de ocho horas y cierre que revoca la sesión en PostgreSQL. Propietario y ayudante tienen los mismos permisos.
- HU-07: registro de datos, categoría, precio único en Bs, combinaciones talla/color, fotografías ordenadas y publicación manual.
- HU-08: búsqueda administrativa de publicados y retirados; edición con datos precargados y conservación del ID y enlace del producto.
- HU-09: publicar, retirar y republicar conservando sus datos. No existe endpoint para borrar productos.
- HU-10: crear y editar combinaciones, marcar disponible/agotado y evitar duplicados. El catálogo refleja disponibilidad y filtros actualizados.

El formulario exige precio positivo con hasta dos decimales, una o más combinaciones y entre una y ocho fotografías. La primera fotografía es la principal; se puede cambiar su orden. Guardar datos, variantes y galería es una única transacción. Si otro administrador modificó el modelo desde que se abrió el formulario, se rechaza la escritura y se solicita recargar para evitar sobrescribir cambios.

### Inicializar las dos cuentas

No existe registro público ni contraseñas predeterminadas en el código. Desde la raíz, con los contenedores iniciados:

```powershell
.\scripts\Initialize-Admins.ps1
```

El asistente solicita usuario, correo, nombre y contraseña de cada administrador. Las contraseñas se introducen de manera oculta, deben tener entre 12 y 128 caracteres y se transmiten por stdin al backend; no se guardan en el script ni en argumentos del proceso. Las dos cuentas se crean en una transacción. Si ya existe alguna identidad, se rechaza la inicialización sin modificar cuentas.

Para cambiar explícitamente las contraseñas de las dos identidades existentes:

```powershell
.\scripts\Initialize-Admins.ps1 -ResetPasswords
```

Introducir exactamente el mismo usuario y correo de cada cuenta; la operación revoca sus sesiones previas. El usuario permite letras minúsculas, números, puntos, guiones y guiones bajos (3–40 caracteres). En otros entornos, `backend/scripts/init-admins.cjs` acepta por stdin JSON con `users: [{username,email,displayName,password}, ...]`, exactamente dos cuentas, y `resetPasswords` opcional. No pasar contraseñas en la línea de comandos.

En la entrega local se inicializaron dos cuentas con contraseñas aleatorias en `.work/accesos-locales.json`, excluido de Git y del contexto Docker. Ese archivo permite revisar los accesos en este equipo; no forma parte del repositorio ni es necesario en producción. Puede sustituirse mediante el asistente de restablecimiento antes del uso real.

### Seguridad

Contraseñas con scrypt (N=131072, r=8, p=1), sal aleatoria y comparación de tiempo constante. Las sesiones usan tokens aleatorios; PostgreSQL conserva únicamente su hash SHA-256. Cookie `HttpOnly`, `SameSite=Lax`, `Secure` en producción; no hay tokens en localStorage ni en respuestas JSON. NestJS valida sesión y autorización en todas las operaciones administrativas. Las escrituras exigen origen permitido y cabecera `X-Topwalker-Request`; el login limita intentos por identidad e IP. El panel también valida la sesión desde el servidor Next.js.

Fuentes: [OWASP: contraseñas](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [OWASP: CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

### Fotografías y Cloudinary

Sin credenciales, `MEDIA_STORAGE=local` mantiene un flujo completo de prueba. Los archivos se guardan en `topwalker_uploads_data`, independiente del volumen PostgreSQL y conservado al reiniciar/recrear contenedores. Este modo no admite cargas con `NODE_ENV=production`.

Para usar Cloudinary, configurar en `.env` las variables `MEDIA_STORAGE=cloudinary`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`, y ejecutar `docker compose up -d --force-recreate backend`. No inventar credenciales ni usar variables `NEXT_PUBLIC_*` para secretos. Las cargas se firman desde NestJS mediante el [SDK oficial](https://cloudinary.com/documentation/node_image_and_video_upload). Los archivos locales anteriores conservan su referencia y proveedor.

Se aceptan JPG, PNG y WebP de hasta 5 MB y 20 megapíxeles; el backend comprueba el contenido, rechaza formatos animados, elimina metadatos y genera WebP de hasta 1800 px. Los nombres del archivo son aleatorios. El navegador envía archivos a un endpoint autenticado, nunca URLs arbitrarias. Los archivos sin publicación solo pueden consultarse con sesión administrativa. Las imágenes publicadas en Cloudinary tienen URLs públicas: retirar un producto lo oculta del catálogo y del endpoint de imágenes, pero no revoca copias o URLs del CDN ya conocidas. La eliminación de archivos huérfanos no es automática para evitar pérdidas accidentales.

### Identidad visual

El original `imagenes de referencia/identidad-top-walker.png.png` se conserva intacto. La copia de frontend está en `frontend/public/brand/top-walker-logo.png`; `src/lib/brand.ts` centraliza ruta y dimensiones, y `BrandLogo` se reutiliza en encabezado público, acceso y panel. El fondo blanco contenido proporciona contraste, manteniendo proporciones sobre la interfaz de carbón y bronce discreto.

El favicon se deriva del mismo logotipo, sin redibujarlo. Para regenerarlo tras sustituir la copia por una imagen oficial de mayor calidad: `cd frontend` y `node scripts/prepare-brand.mjs`. Actualizar también las dimensiones en `src/lib/brand.ts` si cambia la proporción.

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
docker compose exec backend node --test test/model.test.mjs
docker compose exec frontend npm run lint
docker compose exec frontend npm run typecheck
docker compose exec frontend node scripts/check-build.mjs
```

La compilación de Next.js se valida en una carpeta temporal del contenedor con `NODE_ENV=production`, sin sobrescribir la caché del servidor de desarrollo.

Pruebas administrativas contra PostgreSQL, después de inicializar las cuentas (el archivo de acceso debe ser local e ignorado por Git):

```powershell
docker compose cp .work/accesos-locales.json backend:/tmp/topwalker-test-admins.json
docker compose exec backend node --test test/admin.test.mjs
```

Puede indicarse otra ruta dentro del contenedor con `ADMIN_TEST_CREDENTIALS_FILE`. Estas pruebas crean productos demostrativos nuevos y los dejan retirados; no borran registros ni modifican productos comerciales. Incluyen validación, permisos, CSRF, sesiones, imágenes, conflictos de edición y contraste con PostgreSQL.

Pruebas de navegador (Microsoft Edge instalado en Windows, mismas dos cuentas disponibles en `.work/accesos-locales.json` o en `ADMIN_TEST_CREDENTIALS_FILE`):

```sh
cd frontend
npm ci
npm run test:e2e
```

Playwright recorre inicio, catálogo, filtros, selección de talla/color y los flujos HU-06 a HU-10 en 360, 768 y 1920 píxeles; guarda capturas en `frontend/test-results/`. Las pruebas administrativas desactivan trazas y vídeo para no registrar credenciales o cookies. La aplicación sigue ejecutándose en Docker. Esperar a que termine cualquier reconstrucción antes de probar: `docker compose up -d --wait`. Para probar solo el catálogo sin cuentas: `npm run test:e2e -- tests/catalog.spec.ts`.

Prueba de persistencia sin eliminar volúmenes ni modificar registros:

```sh
docker compose exec backend node test/persistence.mjs capture
docker compose restart db
docker compose up -d --wait db
docker compose restart backend frontend
docker compose up -d --wait
docker compose exec backend node test/persistence.mjs verify
```

La captura compara productos y sus relaciones, cuentas y hashes de los archivos locales. Se guarda temporalmente en el contenedor backend; no recrearlo entre `capture` y `verify`.

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
- Autenticación y gestión administrativa implementadas; las escrituras del catálogo requieren sesión y validación de origen.
- WhatsApp requiere número real; Cloudinary está integrado pero su verificación contra el servicio real requiere credenciales.

## Versiones

Node.js 22 (imagen Debian Bookworm), PostgreSQL 17, Next.js 16.4.6, NestJS 11.2.11, Prisma 6.19.3, TypeScript 5.9.3 y Tailwind CSS 4.3.5. `package-lock.json` fija las dependencias transitivas y Docker instala con `npm ci`. Se conserva Prisma 6 con su cliente y CLI de la misma versión; no se mezcla la API de adaptadores de Prisma 7/8.

Compatibilidad revisada en las fuentes oficiales: [Next.js](https://nextjs.org/docs/app/getting-started/installation), [NestJS](https://docs.nestjs.com/faq/versions), [Prisma](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/database-drivers). Las versiones concretas se contrastaron con el registro npm.

Override acotado: `@prisma/config` utiliza `deepmerge-ts` 8.0.0 para corregir [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). Verificados generación del cliente, migraciones, compilación y consultas con esta combinación. React y React DOM resueltos a 19.3.1 por el lockfile.

La misma dependencia utiliza `effect` 3.22.5 para corregir GHSA-7589-6fvf-x4pw sin cambiar la versión de Prisma. Cloudinary SDK 2.11.0 y Sharp 0.35.5 procesan fotografías desde el backend.

Este Compose es de desarrollo local, con recarga automática y puertos limitados a loopback. Un despliegue público requerirá imágenes de producción, HTTPS y configuración de dominio y secretos.
