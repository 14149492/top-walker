# Top Walker — progreso

## 2026-11-22 · Fotografias en las estadisticas

- La API administrativa de estadisticas incluye la primera foto ordenada de cada modelo (`url`, `alt`, `position`) o `null` si ya no tiene fotografia. Se consulta en bloque con los productos del informe; no cambia los conteos ni crea eventos.
- Miniatura junto al nombre en rankings de vistas/consultas, interes por talla/color y consultas por variante. Se reutiliza `ProductPhoto`, con tamaño adaptable y texto Sin foto para historicos sin imagen. Se mantiene la proteccion administrativa y el diseño recibido.
- Archivos: `backend/src/analytics/analytics.service.ts`, pagina administrativa de estadisticas, `commercial.css`, pruebas `backend/test/statistics-photos.test.cjs` y `frontend/tests/statistics-photos.spec.ts`.
- Tipos backend, lint frontend/backend y compilacion Next.js con TypeScript aprobados. **2/2 pruebas backend** aprobadas: imagen principal en los cinco informes y caso historico sin imagen, manteniendo metricas. **3/3 recorridos de navegador** aprobados en 360/768/1920 px: API protegida, acceso administrativo, cinco filas con cinco miniaturas reales cargadas por ancho, ausencia de desbordamiento de pagina y cierre de sesion. Revision visual de escritorio completada. Sin crear productos, fotos ni eventos de prueba. Cambios locales, sin nuevo commit/push.

## 2026-11-22 · Gestion de las 25 fotos, limpieza y sincronizacion del diseño

- Ejecutados `git fetch origin` y `git pull --ff-only origin main` por solicitud del usuario. Resultado: `Already up to date`, HEAD y origin/main en `c194a17`. El arbol estaba limpio porque ese commit ya incluia los avances locales. Se revisaron y conservaron `reference.css`, sus tipografias locales y los recursos de fondo/hero incorporados por el usuario; no hubo conflictos ni sustitucion del diseño recibido.
- El listado administrativo ahora muestra todas las fotografias por modelo, su color, la principal y un contador total. Cada foto enlaza a la seccion Fotografias del formulario. Se mantienen una sola edicion/publicacion por modelo y las relaciones existentes: 12 modelos, 25 fotos, sin crear productos duplicados.
- Limpieza expresamente solicitada ejecutada con `backend/scripts/clean-catalog.cjs --apply`, previa simulacion y respaldo verificado. Eliminadas 74 referencias de fotos ajenas al manifiesto y 67 registros/archivos locales de medios. Archivados logicamente 34 modelos demostrativos que seguian en el panel. No se borraron productos, variantes, eventos, cuentas, volumenes ni originales suministrados.
- Verificacion de integridad posterior: los datos de los 12 modelos comerciales y los bytes de sus 25 fotos permanecen identicos. Segunda simulacion: cero fotos, archivos o modelos pendientes de limpieza; quedan 25 registros Photo y 25 MediaAsset.
- Respaldo privado de registros e imagenes retiradas: `/app/uploads/.catalog-cleanup/2026-11-22T20-31-17-326Z/`, dentro del volumen de Top Walker, fuera de las rutas servidas por la API. Las referencias visuales y los fondos del sitio no son productos y se conservan.
- Compilacion de produccion Next.js (incluye TypeScript) y lint aprobados. Primera pasada de navegador: 5/9 aprobadas; 4 fallos por tiempo/conexion mientras se actualizaba el diseño y se compilaba. Se ajusto el tiempo total de los recorridos que cargan todas las imagenes y se desactivo el desplazamiento animado en las pruebas, conservando las mismas comprobaciones.
- Verificacion final sobre el commit sincronizado: **9/9 recorridos aprobados en 360/768/1920 px**. Incluye login, 25 fotos administrativas contrastadas con el manifiesto y cargadas con `img.decode()`, busqueda Mustang con 4 fotos, apertura del editor, cierre de sesion, catalogo publico, filtros, galeria por color, WhatsApp interceptado, rutas retiradas y conexion PostgreSQL. Sin registros comerciales ni eventos de prueba añadidos. Revision visual de inicio movil y gestion escritorio completada; capturas locales en `frontend/test-results/` y `.work/studio-review/`.
- Pendientes de esta entrega: los ajustes posteriores de pruebas y documentacion permanecen locales, sin un nuevo commit/push. Las existencias reales continuan pendientes de confirmacion administrativa, como se documento en la importacion.

## 2026-11-22 · Correccion visual, 25 presentaciones y contenido de marca

- Sustituidos los acentos cafe/bronce por blanco y grises neutros en la capa visual compartida del sitio y administracion, siguiendo la ultima referencia del usuario. Se conservan el logotipo y los colores naturales de los zapatos.
- Las 25 fotos ya estaban importadas en 12 modelos; el catalogo mostraba solo sus portadas. Ahora muestra una tarjeta por fotografia/color, con disponibilidad correspondiente y enlace directo a esa foto en la galeria. No se duplicaron ni alteraron productos en PostgreSQL.
- Inicio: segundo acceso a Nosotros, colecciones reales Botines/Oxford/Derby y relato ampliado sobre produccion boliviana, cuero, estilos y consulta directa. No se inventan ubicacion, historia, envios ni garantias. Textos nuevos sin tildes, conservando la ñ.
- Archivos: `frontend/src/app/{page.tsx,commercial.css,catalogo/page.tsx,catalogo/[slug]/page.tsx}`, componentes `product-card.tsx` y `product-gallery.tsx`, `lib/brand.ts`, `tests/catalog.spec.ts` y documentacion comercial.
- Verificacion cerrada: lint, tipos y compilacion de produccion Next.js aprobados. Se corrigio la inferencia del tipo opcional de foto. Navegador: **6 recorridos aprobados en 360/768/1920 px** (5 en la primera pasada y el recorrido movil aprobado al repetirlo). El primer intento movil recibio `UND_ERR_SOCKET`, un cierre temporal de conexion; la repeticion paso sin cambiar las comprobaciones. Se verificaron las 25 URLs de fotos y su carga real con `img.decode()`, filtros, apertura de la foto seleccionada, galeria, WhatsApp interceptado y ausencia de desbordamiento horizontal. Revision visual de inicio en los tres anchos y catalogo escritorio completada.
- Consulta final de API: **12 modelos, 25 fotografias y 25 URLs unicas**. Healthcheck confirma conexion con PostgreSQL; los tres contenedores estaban saludables. Esta correccion solo modifica presentacion y pruebas: no requiere migraciones ni escrituras en la base de datos. Capturas locales en `.work/monochrome-review/`. Cambios disponibles localmente, sin nuevo commit/push.

## 2026-11-22 · Catalogo real y modulo comercial — implementado y verificado

- Revisados los requisitos nuevos y las 25 imagenes; preparados 25 recortes WebP individuales y manifiesto trazable. Revision visual de originales, textos y recortes completada.
- Confirmaciones del usuario: separar Oxford Negro (Bs 350) y Oxford Cafe (Bs 300); colores Luca negro y Shelby negro/gris/cafe. Agrupacion en 12 fichas sin inferir disponibilidad de los rangos anunciados.
- Importacion ejecutada: 12 modelos creados, 25 fotos vinculadas en almacenamiento local. Demostrativos retirados, sin borrarlos. Importador idempotente con opcion explicita de actualizacion; no cambia disponibilidad confirmada al repetir.
- Migracion aditiva para importKey, detalles, fotos por color, disponibilidad pendiente, eliminacion logica y eventos. Se conservan volumenes y registros existentes.
- Implementados galeria, paleta carbon/cuero/bronce, acceso administrativo desde TW, numero de prueba WhatsApp, eliminacion logica con confirmacion, eventos y panel `/admin/estadisticas` protegido. La ficha distingue tallas anunciadas de disponibilidad confirmada.
- Documentacion de importacion, decisiones, datos, privacidad y limites en `documento del proyecto/catalogo-comercial.md`. Cloudinary externo pendiente de credenciales: se verifico que no estan completas; se mantiene el almacenamiento local persistente.
- Verificacion funcional cerrada: **24 casos backend aprobados** (20 de administracion/catalogo/modelo y 4 del bloque comercial tras corregir la validacion de identificadores de medios importados). Se comprobo importacion repetida sin cambios, datos exactos del manifiesto, 25 imagenes accesibles, eventos concurrentes, deduplicacion, limites, filtros de fecha, permisos y conservacion del historial al eliminar.
- Navegador: **15 recorridos aprobados en 360/768/1920 px**. Primera pasada: 11 aprobados y 4 pendientes; repeticion de esos cuatro: 4/4 aprobados. Se corrigieron selectores ambiguos tras agregar Confirmada y se repitio una consulta afectada por recarga del backend. Incluye acceso por TW, CRUD, disponibilidad, galeria, eliminacion cancelada/confirmada, estadisticas y WhatsApp incluso con API de eventos fallando. Los destinos WhatsApp se interceptan: no se enviaron mensajes.
- Lint y tipos finales de frontend/backend aprobados; NestJS compilado en la imagen final y compilacion de produccion Next.js aprobada. Revision visual de inicio/ficha movil y ficha escritorio completada; carga de todas las imagenes comprobada en navegador sin registrar visitas de prueba. Los eventos automatizados quedan asociados a fixtures demostrativas excluidas de informes.
- Persistencia aprobada tras reconstruir/recrear frontend y backend y reiniciar los tres servicios: instantanea identica de 58 productos (incluye historicos y QA), 22 eventos, 92 archivos de imagen con SHA-256 y 2 cuentas. Las 12 fichas comerciales permanecen publicadas. PostgreSQL, NestJS y Next.js saludables; cuatro migraciones aplicadas sin pendientes. No se eliminaron volumenes ni recursos de otros proyectos.
- Archivos principales: `backend/catalog/` y `scripts/prepare-catalog.py`; importador y verificador de persistencia en `backend/scripts/`; schema/migracion Prisma; modulos admin/catalog/media y nuevo `analytics/`; formularios, galeria, opciones, encabezado, tema `commercial.css`, rutas de estadisticas/privacidad, pruebas backend/Playwright; Compose, variables de ejemplo, README y documentacion de datos/comercial.
- Pendientes externos: confirmar existencias por talla/color desde el panel y configurar/verificar Cloudinary si se decide activarlo. El numero WhatsApp es el de prueba autorizado; se verificaron enlaces y mensajes sin enviar consultas reales. Los cambios estan disponibles localmente y aun no tienen un nuevo commit/push; el respaldo previo sigue siendo `66eed48`.

## 2026-11-22 · Punto de respaldo previo a la nueva etapa

- A peticion del usuario, se prepara un commit con los avances existentes: tema oscuro, busqueda sin tildes, correccion de filtros, caracteristicas del calzado y documentacion. Incluye las 25 fotografias originales JPG de `zapatos1`, sin procesar, como entrada para la siguiente etapa.
- Este punto no implementa todavia el nuevo catalogo real, rediseño, eliminacion logica ni estadisticas solicitados en el documento adjunto. Las verificaciones funcionales anteriores conservan sus resultados y pendientes; no se repiten suites para crear el commit.
- Se excluyen credenciales, `.env`, `.work`, dependencias y resultados de pruebas. El commit conserva archivos del proyecto, no una copia de PostgreSQL ni de los volumenes Docker. Se revisan formato y presencia de secretos antes de confirmar; sin push en esta operacion.

## Estado actual · 2026-11-20

- **Sprint 1 completado: HU-06 y HU-07 (8 puntos). Sprint 2 completado: HU-08, HU-09 y HU-10 (9 puntos).** Verificados desde el navegador hasta PostgreSQL.
- Panel: http://localhost:3000/admin/login. Dos cuentas locales independientes con iguales permisos; acceso privado en `.work/accesos-locales.json`. Inicialización/restablecimiento documentados en README y `scripts/Initialize-Admins.ps1`.
- Tres contenedores construidos, iniciados y saludables. Persistencia comprobada tras reiniciar los tres servicios, sin eliminar volúmenes ni recursos ajenos.
- Cierre de los sprints: **19/19 pruebas backend y 12/12 de navegador aprobadas**. Cambios posteriores de paleta/busqueda: **20/20 backend y 9/12 de navegador aprobadas**; tres pruebas de catalogo corregidas pendientes de repeticion. Lint, tipos y compilaciones aprobados. Los resultados de cada etapa se detallan por separado.
- Logotipo real reutilizado en encabezado, login y panel; favicon derivado y tema oscuro coherente. Original y copia tienen SHA-256 idéntico.
- Cloudinary queda pospuesto por decision del usuario; se mantiene el almacenamiento local persistente. WhatsApp comercial, fotografias definitivas, RNF de carga y despliegue continuan fuera de estos sprints.
- Entrega de los sprints subida a GitHub en el commit `2d15829`. Los ajustes posteriores de colores, busqueda y documentacion permanecen locales; no se presentan como una nueva entrega verificada.

Las secciones siguientes conservan el historial de etapas; el cierre administrativo y sus evidencias están al final.

## 2026-11-20 · Paleta monocroma y busqueda sin tildes

- Nueva referencia del usuario: fondos negros/grises, bordes discretos y botones blancos. Esta indicacion actualiza la preferencia anterior por acentos de bronce. Se mantiene el logotipo proporcionado.
- `frontend/src/app/theme.css`: paleta y tipografia coherentes en catalogo, inicio, ficha, acceso y panel. Textos fijos del frontend sin tildes; se conserva la ñ. No se modifican nombres ni otros datos guardados.
- `backend/src/database/product-search.ts`: filtro compartido para catalogo y listado administrativo. Normalizacion NFC, equivalencia de caracteres españoles con/sin acento y coincidencia literal parametrizada. Se mantienen filtros de publicacion, categoria y talla.
- Pruebas añadidas para botin/BOTÍN/Unicode descompuesto, mocasin, combinacion de filtros, retirada y caracteres literales de SQL. Backend: **20/20 aprobadas**; lint y tipos aprobados. Imagen backend construida y compilacion de produccion Next.js aprobada; los tres contenedores saludables.
- Navegador: **9/12 aprobadas** en la primera pasada (administracion completa y proxy/retirados en tres anchos). Las tres pruebas restantes se detuvieron porque esperaban ocho productos; el catalogo ya contiene nueve, incluido el modelo real `casual 1` agregado por el usuario. Se adapto la prueba para contrastar el recuento real de la API, conservando ese producto.
- La repeticion de esas tres pruebas quedo pendiente: se rechazo el permiso de la herramienta para abrir el navegador. No se afirma que esa repeticion haya pasado. Los cambios de esta etapa permanecen locales, pendientes de cerrar esa comprobacion antes de una nueva entrega a GitHub.

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

## Pendiente al finalizar la entrega inicial del 18 de noviembre

- HU-06 a HU-10: autenticación, cuentas administrativas independientes, sesiones, panel, alta/edición, publicación y gestión de disponibilidad. No se afirma que autorización o persistencia de edición administrativa estén implementadas.
- HU-05: configurar número real de WhatsApp y verificar el enlace con ese número. No se enviaron mensajes ni se inventó contacto.
- Fotografías comerciales reales y credenciales Cloudinary; actualmente solo demostración con referencias suministradas.
- Prueba RNF-02 con 50 productos, conexión limitada y dispositivo acordado; RNF-05 requiere monitoreo mensual y despliegue.
- Repositorio Git inicializado en `main`, con remoto `origin` en https://github.com/14149492/top-walker.git. La subida del código se registra en la sección de entrega; no se realizó despliegue externo de la aplicación.
- No se conocen errores funcionales pendientes en los recorridos públicos probados. El entorno entregado es de desarrollo local.

## 2026-11-18 · Reglas confirmadas y diseño de datos propuesto

- Revisados AGENTS.md actualizado, requisitos y criterios del DOCX, esquema, migración y consultas existentes.
- El usuario confirmo las reglas de negocio. La estructura de tablas y el diagrama ER fueron propuestos durante el desarrollo por Codex a partir de esas reglas y la documentacion; no se recibio un diagrama de base de datos como diseño previo aprobado.
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
- Primer commit `8f24068` subido a `origin/main`; referencia remota comprobada. Contenido revisado: 65 archivos, sin credenciales detectadas ni archivos excluidos.
- Esta entrega no cambia funcionalidades; se conservan los resultados de pruebas documentados arriba.

## 2026-11-19 · Implementación de los sprints administrativos

- Revisión de instrucciones, requisitos HU-06 a HU-10, Prisma/migraciones, módulos, páginas, Compose y referencias completada. Se conserva el proyecto existente.
- Logotipo localizado en `imagenes de referencia/identidad-top-walker.png.png` (604×464). Original conservado; copia en `frontend/public/brand/`, componente `BrandLogo` y configuración centralizada. Favicon derivado, sin rediseñar la marca. Paleta carbón, blanco contenido y bronce discreto.
- Diseño: sesiones opacas revocables en PostgreSQL; hash scrypt, cookie HttpOnly y comprobación de origen/cabecera en escrituras. Dos cuentas con iguales permisos, inicialización por stdin sin secretos en código ni argumentos.
- Imágenes: Cloudinary desde backend; modo local explícito para pruebas, con volumen persistente y validación/reprocesado de archivos.
- Migración administrativa aditiva: usuarios, sesiones, intentos de login, archivos y control de concurrencia en productos. Sin borrar productos existentes.
- HU-06: módulos de autenticación, guards de NestJS, páginas protegidas en Next.js e inicialización segura mediante `scripts/Initialize-Admins.ps1` y `backend/scripts/init-admins.cjs`. Dos cuentas locales inicializadas con contraseñas aleatorias; accesos guardados únicamente en `.work/accesos-locales.json`, ignorado por Git.
- HU-07: formulario completo con validaciones, carga y orden de fotografías, categoría, precio único y combinaciones disponibles/agotadas. Guardado atómico en Prisma. Almacenamiento local persistente operativo sin credenciales Cloudinary.
- HU-08: listado y búsqueda administrativa, edición precargada, conservación de IDs de relaciones retenidas y detección de conflictos por versión.
- HU-09: publicación, retirada y republicación; los datos permanecen en PostgreSQL. Sin endpoint de borrado físico.
- HU-10: alta/edición de combinaciones, normalización de colores, rechazo de duplicados y actualización de la ficha y filtros públicos.
- Pruebas de API administrativas: **8/8 aprobadas** (suite principal y siete escenarios) contra PostgreSQL, con ambas cuentas, CSRF, credenciales, sesión expirada/revocada, archivos válidos e inválidos, escritura, edición, conflicto, variantes y publicación. Los registros de prueba se conservan como demostraciones retiradas.
- Incidencia corregida: resultado `void` del bloqueo de PostgreSQL incompatible con deserialización Prisma; se selecciona una columna numérica desde la función. Repetición del flujo de alta aprobada.
- Incidencia corregida: TypeScript no detectaba cambios del montaje Windows de forma consistente; polling configurado para el entorno Docker.
- Navegador: corregidas las etiquetas accesibles de categoría y descripción precargada, y los botones que aceptaban clic antes de hidratar. La verificación final de los recorridos se registra a continuación.
- Dependencias: override acotado de `effect` 3.22.5 dentro de `@prisma/config`; `npm audit` del lockfile backend sin vulnerabilidades. No se cambia la versión principal de Prisma.
- README y documento de modelo actualizados con cuentas, sesiones, controles, imágenes, identidad y comandos reproducibles.

## 2026-11-20 · Cierre de Sprint 1 y Sprint 2

Planificacion solicitada por el usuario:

| Historia | Sprint | Puntos | Prioridad | Riesgo |
| --- | --- | --- | --- | --- |
| HU-06 | 1 | 3 | Alta | Medio |
| HU-07 | 1 | 5 | Alta | Medio |
| HU-08 | 2 | 3 | Alta | Medio |
| HU-09 | 2 | 3 | Media | Bajo |
| HU-10 | 2 | 3 | Alta | Medio |

Sprint 1: **8 puntos**. Sprint 2: **9 puntos**. Las evidencias siguientes corresponden al cierre original de esos sprints; la revision posterior de colores/busqueda tiene su propio estado al inicio del documento.

| Historia | Resultado verificado |
| --- | --- |
| HU-06 | Acceso por correo/usuario, error de credenciales, protección de todas las rutas solicitadas, cookie HttpOnly/SameSite, sesiones vencidas y cierre con revocación. Ambas cuentas acceden con los mismos permisos. |
| HU-07 | Registro desde formulario, imágenes reales cargadas al almacenamiento de prueba, categoría, material, descripción, precio único, variantes y fotografía principal. Validaciones de campos y contenido de imagen. |
| HU-08 | Búsqueda, datos precargados, edición por el segundo administrador, persistencia y cambios visibles públicamente. Se conservan producto/slug/IDs retenidos; se rechazan versiones desactualizadas. |
| HU-09 | Publicar, retirar y republicar desde el panel. Exclusión pública y conservación de datos/relaciones. |
| HU-10 | Combinaciones disponibles/agotadas, creación y edición de talla/color, prevención de duplicados y filtros/ficha pública actualizados. |

### Evidencia de verificación

- `docker compose up --build -d --wait`: imágenes reconstruidas e iniciadas; PostgreSQL, NestJS y Next.js saludables. Migraciones inicial y administrativa aplicadas; `prisma validate` y `migrate status` aprobados.
- Backend: lint, TypeScript y compilación en Docker sin errores. `node --test test/admin.test.mjs test/catalog.test.mjs test/model.test.mjs`: **19 aprobadas, 0 fallidas** (ocho administrativas contando la suite principal, seis del catálogo, cinco del modelo).
- Frontend: lint y TypeScript aprobados en host y Docker. Compilación de producción mediante `scripts/check-build.mjs` aprobada; reconoce todas las rutas administrativas y públicas. Se conserva el servidor de desarrollo durante esta comprobación.
- Playwright/Microsoft Edge: **12 aprobadas, 0 fallidas** en 360, 768 y 1920 px. Incluye crear como propietario, editar como ayudante, cargar/reordenar fotos, publicar/retirar/republicar, cambiar talla/color, verificar ficha/filtros, rechazar duplicados/precio inválido, acceso denegado y cierre. Sin errores JavaScript ni desbordamiento horizontal en los recorridos comprobados.
- Capturas en `frontend/test-results/`; inspeccionados login, formulario, panel y recursos de marca. Trazas y vídeo administrativos desactivados para evitar registrar credenciales.
- Persistencia: captura de **18 productos con todas sus relaciones, 2 cuentas y 22 archivos locales**, reinicio de db/backend/frontend, espera de salud y comparación idéntica de registros y SHA-256 de imágenes. Se conservan los nueve productos originales. Los productos nuevos de QA quedan identificados como demostrativos y retirados.
- Copia del logotipo idéntica al original (SHA-256); favicon de 64×64 generado desde la misma imagen, preservando la forma. Su sustitución está centralizada en `frontend/src/lib/brand.ts`.
- Incidencia de construcción: descarga npm interrumpida por ECONNRESET. Corregida mediante reintento, caché BuildKit acotada al backend y tiempos de descarga limitados; la construcción posterior terminó correctamente. Auditoría backend: **0 vulnerabilidades reportadas**.

### Archivos y entrega

- Datos: `backend/prisma/schema.prisma`, migración `202611190001_administration`.
- Lógica: módulos `backend/src/auth/`, `admin/`, `media/`, inicializador y pruebas de integración/persistencia.
- Interfaz: `frontend/src/app/admin/`, componentes administrativos, cliente/servidor HTTP, estilos, marca y pruebas Playwright.
- Entorno: `compose.yaml` (volumen de imágenes y variables privadas), Dockerfile backend, polling TypeScript y `.env.example`.
- Documentación: README, este progreso y `documento del proyecto/modelo-datos.md`. Repositorio de entrega: https://github.com/14149492/top-walker.git, rama `main`.
- `.env`, accesos locales, dependencias y evidencias privadas quedan excluidos de Git. No se publican contraseñas ni sesiones.
- No se conocen errores pendientes en los recorridos probados. Cloudinary requiere credenciales reales para una comprobación externa; el almacenamiento local de pruebas y sus archivos persistentes ya fueron verificados. Este entorno sigue siendo de desarrollo local.

## 2026-11-20 · Revision de documentacion

- Revisados seguimiento, manual de ejecucion y modelo de datos. Se aclara el estado actual frente a los resultados historicos y se agrega la tabla de puntos, prioridades y riesgos definida por el usuario.
- README ampliado con la aplicacion concreta de cliente-servidor y tres capas, sus carpetas y flujo de solicitudes.
- Modelo de datos ampliado con el origen del diseño, la inicializacion de PostgreSQL, la funcion de las migraciones y la entidad LoginAttempt en el diagrama ER.
- Esta revision modifica documentacion; no cambia datos, contenedores o funcionalidades ni repite las pruebas de navegador cuyo permiso fue rechazado.

## 2026-11-20 · Correccion visual de filtros

- Corregido `frontend/src/app/theme.css`: usar `background-color` conserva la posicion y `no-repeat` de la flecha de los selectores. El shorthand `background` los reiniciaba y producia el mosaico mostrado por el usuario.
- Verificacion puntual con Edge/Playwright sobre el catalogo local en 360, 768 y 1920 px: ambos selectores tienen `background-repeat: no-repeat` y flecha alineada a la derecha; seis comprobaciones aprobadas. Capturas en `frontend/test-results/filters-*.png`; captura movil revisada visualmente.
- Cambio limitado a CSS, sin modificaciones de datos. Esta comprobacion visual no sustituye las pruebas funcionales pendientes registradas anteriormente.

## 2026-11-20 · Presentacion comercial y caracteristicas del calzado

- Informacion del negocio proporcionada por el usuario integrada en inicio, Nosotros, pie de pagina, metadatos y acceso administrativo: emprendimiento boliviano de produccion y comercializacion de calzados en 100% cuero con diseños en tendencia. Se conserva el tema oscuro y los textos nuevos sin tildes.
- HU-07/HU-08: campos opcionales por modelo para plantas (`sole`), plantilla interna (`insole`) y forro interno (`lining`), editables desde el panel y visibles en la ficha publica cuando tienen contenido. Hasta 200 caracteres, validacion NestJS y persistencia Prisma. Material, precio unico y tallas por color conservan su estructura.
- La imagen de SHELBY se utiliza como referencia para los ejemplos del formulario. No se ha creado una oferta real ni aplicado su precio, rango de tallas o caracteristicas a otros modelos. Las tallas mostradas proceden de las variantes reales; no se inventan tallas intermedias.
- Migracion aditiva `202611200001_product_characteristics` aplicada: tres columnas opcionales, sin borrar o reemplazar datos. Campos omitidos en API conservan su valor; texto vacio/null permite limpiarlos. Prisma informa tres migraciones al dia.
- Archivos: schema/migracion Prisma, DTO y servicios admin/catalogo; tipos frontend, formulario, componente `product-characteristics.tsx`, ficha, tema, marca, inicio y login. README y modelo de datos actualizados.
- Docker reconstruido y los tres servicios saludables. Backend: **20/20 pruebas aprobadas**, ampliadas para validar tipos/longitudes, lectura publica, persistencia, actualizacion, limpieza y compatibilidad al omitir campos. Lint y tipos de ambos servicios aprobados; compilaciones NestJS y Next.js aprobadas. Inicio servido por HTTP comprobado con la nueva descripcion.
- Fotografias: se mantiene almacenamiento local; Cloudinary pospuesto por decision del usuario.
- Navegador: **3/3 recorridos HU-07 a HU-10 aprobados** en 360, 768 y 1920 px (3.3 minutos). Verificado registro de las tres caracteristicas, lectura publica, precarga al editar, cambio de plantas y retirada del forro al vaciarlo; sin desbordamiento horizontal. Se usan modelos QA marcados como demostrativos y retirados al finalizar. No se repitieron en esta etapa las pruebas de catalogo pendientes de la etapa anterior.
- Cambios de esta etapa disponibles en el entorno local; no se ha realizado un nuevo push a GitHub.

## 2026-11-20 · Contenido provisional del catalogo

- A peticion del usuario, completados los tres campos vacios de los ocho modelos publicados (todos de demostracion): plantas `Super ligeras antideslizantes`, plantilla interna `Piel de res y acolchado` y forro interno `Piel de res badana`. Son datos provisionales editables, basados en el ejemplo compartido.
- Actualizacion mediante API administrativa autenticada, respetando versiones y conservando nombres, descripciones, materiales, precios, publicacion, categorias, fotos y variantes. Los modelos retirados quedan intactos. Copia previa de los productos y script puntual guardados en `.work/`, fuera de Git; no se mostraron credenciales y la sesion se cerro al terminar.
- Comprobadas las respuestas publicas de los ocho modelos y las tres caracteristicas en el HTML de la ficha Oxford Ejecutivo. Solo se modificaron datos locales y este seguimiento; no se repitieron suites de pruebas ni se cambio la semilla.


## Ajuste visual según referencia (2026-11-22)

- Solo cambios de presentación, sin cambios de funcionalidad ni de textos.
- Nuevo `frontend/src/app/reference.css` (cargado al final en `layout.tsx`): tipografía sans moderna, header compacto con logo cuadrado y wordmark en mayúsculas, hero carbón con foco de luz, botones blanco/contorno, franja de valores con líneas, colecciones en 4 columnas (texto a la izquierda, foto a la derecha).
- `frontend/src/app/page.tsx`: los glifos de la franja de valores se reemplazaron por íconos SVG de línea (decorativos, `aria-hidden`).
- Verificado: la página se recarga en caliente y responde en http://localhost:3000.
- Iteración 2 del hero: escena de estudio con foco y pedestal (`frontend/public/brand/hero-scene.jpg`, imagen generada sin productos) y recorte sin fondo de la foto real del modelo Mustang (`frontend/public/brand/hero-product.png`). Nota: el recorte es fijo; si cambia el producto destacado, regenerar el recorte. Verificado con captura en 1280 px.
- Iteración 3 (2026-11-22):
  - **Calzado y composición del hero (`frontend/public/brand/hero-scene.jpg`, `hero-product.png`)**: se amplió el tamaño del modelo Mustang (~80% de la altura del hero, desde el borde superior hasta el pedestal) sobre un pedestal de piedra oscuro en perspectiva 3D que abarca desde el centro (~46.5% del ancho) hasta el extremo derecho, con haz de luz diagonal de estudio y sombras de contacto reales para eliminar el espacio vacío en pantallas anchas.
  - **Fondos de secciones (`frontend/src/app/reference.css`)**: se reemplazó el fondo negro plano por una paleta carbón/antracita multicapa (`#18191b` a `#25262a`) con iluminación radial de estudio, franja de valores metálica elevada, tarjetas con luz ambiental cálida y borde interior sutil (`inset 0 1px`), y sección "Nuestra esencia" como panel editorial.
  - **Tipografía (`frontend/public/fonts/*.woff2`, `reference.css`)**: se incorporaron fuentes locales `Outfit` (títulos, wordmark, precios) y `Plus Jakarta Sans` (interfaz y cuerpo) con jerarquía de pesos y degradado metálico en el subtítulo del hero.
  - Sin cambios de funcionalidad ni textos; verificado mediante captura de pantalla completa en 1536 px.
- Iteración 4 (2026-11-22):
  - **Fondo arquitectónico de estudio en todo el sitio (`frontend/public/brand/studio-bg.jpg`, `reference.css`)**: textura de concreto/piedra oscura con haces de luz diagonales y juntas arquitectónicas en `body`, además de escena de estudio con foco y calzado sobre pedestal en la página de **Contacto** (`/contacto`) y en el encabezado de **Catálogo** (`/catalogo`), manteniendo intacta la portada principal (`/`).
  - **Tipografía editorial de marca (`frontend/public/fonts/playfair*.woff2`, `cinzel*.woff2`, `reference.css`)**: títulos principales y precios en **Playfair Display** (con segunda línea `<em>` en cursiva editorial y degradado metálico), logotipo y etiquetas superiores (`eyebrow`) en **Cinzel**, e interfaz/cuerpo en **Plus Jakarta Sans**.
  - Verificado con capturas en 1536 px de `/` y `/contacto`.


## Migración de imágenes a Cloudinary (2026-11-23)

- Se configuró `MEDIA_STORAGE=cloudinary` y las credenciales de Cloudinary en `.env` local (ignorado por Git).
- Se creó el script `backend/scripts/migrate-media-to-cloudinary.cjs` y se ejecutó contra `topwalker-backend`.
- Resultado: 25/25 fotografías del catálogo migradas a Cloudinary (`topwalker/<id>`) y actualizadas en la tabla `MediaAsset` (`provider = 'cloudinary'`, `remoteUrl = https://res.cloudinary.com/...`), 0 errores y 0 archivos locales pendientes.
- Verificado: `/api/media/<id>` redirige correctamente a `https://res.cloudinary.com/...` y entrega la imagen en WebP.


## Cierre de pendientes funcionales, administración y pulido (2026-11-23)

- **Disponibilidad aleatoria confirmada (`backend/scripts/randomize-availability.cjs`)**: conforme a `AGENTS.md` (sin inventario numérico), se confirmó la disponibilidad de todas las variantes del catálogo real marcando aleatoriamente entre 1 y 4 tallas como `available = true` por cada combinación de modelo y color (25 grupos: 63 disponibles, 97 agotadas).
- **WhatsApp (`.env`)**: configurado `WHATSAPP_NUMBER=59176928024` (Bolivia + `76928024`) y verificado en los enlaces del detalle de producto y `/contacto`.
- **Limpieza de imágenes huérfanas (`backend/src/media/media.service.ts`, `media.controller.ts`, `admin.service.ts`, `product-form.tsx`)**: agregado `DELETE /api/admin/media/:id` para eliminar fotos recién subidas y quitadas antes de guardar, y limpieza automática en Cloudinary (`cloudinary.uploader.destroy`) y disco local al retirar fotografías de un producto existente.
- **Gestión de categorías (`admin.controller.ts`, `admin.service.ts`, `/admin/categorias`)**: agregados `PUT /api/admin/categories/:id` y `DELETE /api/admin/categories/:id` (rechaza borrar categorías con productos asociados) y pantalla de administración en `frontend/src/app/admin/(protected)/categorias/page.tsx`.
- **Cambio de contraseña (`auth.controller.ts`, `auth.service.ts`, `/admin/cuenta`)**: agregado `POST /api/auth/change-password` con validación de contraseña actual, hash seguro y revocación de otras sesiones activas, más interfaz en `frontend/src/app/admin/(protected)/cuenta/page.tsx`.
- **Portada sincronizada y tildes (`page.tsx`, `reference.css`, `header.tsx`, `catalogo/page.tsx`, `contacto/page.tsx`, `not-found.tsx`, `catalog-filters.tsx`, `brand.ts`)**: la composición de estudio de *Mustang* solo se aplica cuando *Mustang* es el producto destacado (con respaldo dinámico a `--hero-image` si se retira) y se corrigieron las tildes en toda la interfaz pública.
- **Verificación**:
  - Backend: `lint`, `typecheck`, `build` y `node --test test/catalog.test.mjs test/model.test.mjs` (**12/12 aprobadas**).
  - Frontend: `lint`, `typecheck` y Playwright `tests/catalog.spec.ts` en 360 px y 1920 px (**4/4 aprobadas**, incluyendo carga de las 25 fotos desde Cloudinary, sin desbordamiento horizontal y enlace `wa.me/59176928024`).
