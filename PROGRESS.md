# Top Walker — progreso

## 2026-11-18 · Etapa 1 ejecutada

- Leídos AGENTS.md, el DOCX completo, los dos diagramas UML y las tres referencias visuales.
- Fuente real: `documento del proyecto/Top_Walker.docx`; se conserva su ubicación. No se encontró `documentacion/` ni PDF.
- Repositorio inicial sin código ni metadatos Git. Docker accesible mediante autorización del entorno; no había contenedores existentes.
- Preparadas tres capas: Next.js + Tailwind, NestJS + Prisma, PostgreSQL; red de datos interna y volumen persistente.
- Healthchecks encadenados: frontend → backend → consulta real a PostgreSQL.
- Migraciones controladas mediante `prisma migrate deploy`; sin `db push` ni reseteos.

## Decisiones funcionales

- Usuario pide disponibilidad por combinación talla/color, sin cantidades.
- Confirmadas explícitamente las seis reglas: talla/color, disponible o agotado sin cantidades, precio por modelo, publicación manual, galería ordenada con principal y retirada reversible sin borrar registros.
- Datos e imágenes demostrativos deben identificarse claramente; no son productos reales.
- Referencias visuales incluyen filtros de color, ordenamiento, últimas unidades y datos de contacto ficticios. No se incorporan como requisitos; priman RF/HU-01 a 10.
- Contacto real, fotografías comerciales y credenciales Cloudinary pendientes.
- Esta etapa cubre infraestructura y el comienzo del catálogo público (HU-01 a HU-04). Administración HU-06 a HU-10 será una etapa posterior.

## Verificación de infraestructura

- Ejecutado `docker compose up --build -d`: las tres imágenes/contenedores se construyeron e iniciaron.
- `docker compose ps`: topwalker-frontend, topwalker-backend y topwalker-db saludables.
- GET `http://localhost:3000/api/health`: 200 con backend `ok` y database `connected` (consulta SQL real).
- `prisma migrate status`: migración inicial aplicada; esquema actualizado.
- Semilla explícita ejecutada: 8 modelos demostrativos publicados, 1 retirado y variantes con diferencias por color.
- `.env` local generado con contraseña aleatoria, sin imprimirla ni incorporarla al código.
- Aviso inicial de deepmerge-ts en Prisma corregido mediante override acotado a `@prisma/config` con versión 8.0.0. Auditoría posterior: 0 vulnerabilidades reportadas en ambos proyectos. Con imagen reconstruida pasaron generación del cliente, build, migraciones y pruebas de integración.

## Etapa 2 · Catálogo público implementado

- HU-01: inicio y catálogo público consultan NestJS/PostgreSQL; tarjetas con foto, nombre y precio.
- HU-02: ficha, material, descripción, fotografías, colores y tallas. Selector refleja disponibilidad por talla/color.
- HU-03/04: búsqueda por nombre sin distinguir mayúsculas, filtros acumulativos por categoría y talla, limpieza y estado sin resultados.
- Productos retirados excluidos del listado y del detalle. Proyección explícita de campos públicos; sin endpoints de escritura.
- Inicio, catálogo, ficha, contacto y estados de carga/error/no encontrado. Estilos oscuros y cobre basados en referencias.
- Imágenes originales conservadas; copias locales usadas como fondos CSS en registros claramente demostrativos.
- Enlaces WhatsApp preparados, deshabilitados sin número válido. HU-05 pendiente de configuración y prueba comercial.
- Archivos principales: `compose.yaml`, Dockerfiles, `backend/prisma/`, `backend/src/catalog/`, `frontend/src/app/`, componentes, pruebas y README.

## Resultados de pruebas

- Backend: lint y TypeScript sin errores; compilación ejecutada dentro de Docker y durante la construcción de la imagen.
- Integración: **6/6 pruebas aprobadas** (`backend/test/catalog.test.mjs`). Salud real de PostgreSQL; recuento público contrastado contra base de datos; retirada de listado/detalle; búsqueda; filtros combinados; disponibilidad talla/color; validaciones y rechazo de métodos de escritura.
- Frontend: lint sin advertencias y comprobación de tipos aprobados. Compilación de producción aprobada con NODE_ENV=production; script `frontend/scripts/check-build.mjs` reproduce la verificación sin interferir con `next dev`.
- Navegador Microsoft Edge/Playwright: **6/6 pruebas aprobadas** en 360, 768 y 1920 px. Inicio → catálogo → filtros → sin resultados → limpiar → ficha → color/talla; sin errores JavaScript ni desbordamiento horizontal. También verifica proxy HTTP y producto retirado.
- Capturas en `frontend/test-results/`; inspección visual de inicio, catálogo y ficha. Fotografías ilustrativas etiquetadas, acciones visibles en móvil.
- Persistencia: captura de **9 productos** con todas sus variantes y fotografías, recreación exclusiva de `topwalker-db` manteniendo `topwalker_postgres_data`, comparación posterior idéntica. No se modificaron registros para esta prueba.
- Red `topwalker_data`: `Internal=true`. `docker port topwalker-db` sin puertos publicados. Solo frontend y backend exponen puertos en 127.0.0.1.
- Compose validado con `docker compose config --quiet`; healthchecks comprobados después de recrear PostgreSQL.

## Incidencias corregidas durante la verificación

- Acceso inicial al motor Docker y al registro npm restringido por el entorno: ejecutados con la autorización de herramientas correspondiente.
- Primera pasada de navegador coincidió con recreación de servicios: falló por interrupciones de conexión; repetida tras `up --wait`.
- Selector de color admitía clics antes de hidratar React: ahora se habilita solo cuando los controladores de eventos están listos (`useSyncExternalStore`). Recorrido posterior aprobado en los tres anchos.
- Primera compilación de producción heredó NODE_ENV=development: falló al prerenderizar la página de error. Corregido mediante entorno explícito de producción y carpeta temporal independiente.
- Aviso de exportación anónima de PostCSS corregido. Icono local incorporado y atributo de scroll de Next.js declarado.

## Pendiente de siguientes etapas

- HU-06 a HU-10: autenticación, cuentas administrativas independientes, sesiones, panel, alta/edición, publicación y gestión de disponibilidad. No se afirma que autorización o persistencia de edición administrativa estén implementadas.
- HU-05: configurar número real de WhatsApp y verificar el enlace con ese número. No se enviaron mensajes ni se inventó contacto.
- Fotografías comerciales reales y credenciales Cloudinary; actualmente solo demostración con referencias suministradas.
- Prueba RNF-02 con 50 productos, conexión limitada y dispositivo acordado; RNF-05 requiere monitoreo mensual y despliegue.
- Repositorio Git inicializado en `main`, con remoto `origin` en https://github.com/14149492/top-walker.git. La subida del código se registra en la sección de entrega; no se realizó despliegue externo de la aplicación.
- No se conocen errores funcionales pendientes en los recorridos públicos probados. El entorno entregado es de desarrollo local.

## 2026-11-18 · Diseño de datos confirmado

- Revisados AGENTS.md actualizado, requisitos y criterios del DOCX, esquema, migración y consultas existentes.
- Las seis reglas confirmadas son compatibles con las cuatro entidades actuales: Category, Product, Variant y Photo. No se requieren cambios estructurales ni una nueva migración.
- `backend/prisma/schema.prisma`: comentarios de dominio sobre precio único, booleanos de publicación/disponibilidad, clave talla/color y posición de foto principal.
- `documento del proyecto/modelo-datos.md`: diagrama ER, correspondencia con RF/HU-01/02/04/07–10, restricciones de SQL y responsabilidades pendientes del backend administrativo. README enlaza el diseño.
- `backend/test/model.test.mjs`: pruebas transaccionales de independencia de variantes, retirada/republicación conservando relaciones, precio exacto y restricciones. Todos los fixtures se revierten; no se modifican datos existentes.
- La posición 0 es la principal por convención de escritura; la base impide duplicados y negativos pero no garantiza secuencia continua. Se documenta la normalización transaccional para el futuro panel, sin afirmar que ya esté implementada.
- Verificación en Docker: `prisma format`, `prisma validate`, `migrate diff` (sin diferencias) y `migrate status` (actualizado). Lint, tipos y compilación del backend aprobados.
- Pruebas de modelo **5/5** aprobadas contra PostgreSQL; integración del catálogo **6/6** aprobada. La primera integración coincidió con la recarga de Node tras compilar y falló por conexión; los logs confirmaron el reinicio y la repetición pasó.
- Los tres contenedores siguen saludables. No se cambiaron tablas, migraciones aplicadas, datos existentes ni interfaz; no se repitieron pruebas visuales, ya aprobadas en la etapa anterior.

## 2026-11-18 · Entrega en GitHub

- Destino indicado y autorizado por el usuario: https://github.com/14149492/top-walker.git; remoto inicialmente vacío.
- Rama de entrega: `main`. Se incluyen código, migraciones, lockfiles, documentación original y referencias visuales.
- `.gitignore` excluye `.env`, dependencias, compilaciones, archivos temporales y capturas/trazas de pruebas. Solo se incorpora `.env.example` con valores de ejemplo.
- Preparación del primer commit y comprobación del contenido antes del push. Pendiente confirmar la referencia remota después de subir.
- Esta entrega no cambia funcionalidades; se conservan los resultados de pruebas documentados arriba.
