# Catalogo comercial y estadisticas — 22 de noviembre de 2026

Esta etapa amplía el alcance inicial por solicitud expresa del usuario: catalogo basado en `zapatos1`, ajustes visuales, acceso por TW, eliminacion logica y estadisticas comerciales. No agrega ventas, pedidos, pagos ni registro de clientes. Punto de respaldo previo: `66eed48`.

## Fuente y decisiones comerciales

Se revisaron individualmente las 25 imagenes proporcionadas. Los originales se conservan. `backend/catalog/manifest.json` registra nombre original, SHA-256 original/procesado, limites de recorte, modelo, color, precio, caracteristicas y tallas anunciadas. `scripts/prepare-catalog.py` reproduce los recortes con Pillow, sin generar ni alterar artificialmente los zapatos. Las 25 copias WebP estan en `backend/catalog/photos/`, con dimensiones maximas de 1400 px y calidad 88.

| Modelo | Precio Bs | Colores / acabados | Tallas anunciadas |
|---|---:|---|---|
| Mustang | 350 | Cafe combinado, Cafe, Negro, Negro combinado | 37–43 |
| Rockstar | 350 | Negro, Cafe, Negro combinado, Camel | 37–43 |
| Shelby | 350 | Negro liso, Gris volcado, Cafe volcado | 38–42 |
| Thunder | 320 | Negro, Nuez | 37–43 |
| Luca | 350 | Negro | 38–43 |
| Shadow | 320 | Cafe, Negro | 37–43 |
| Zero | 320 | Cafe, Negro | 37–43 |
| Classic | 320 | Negro | 37–43 |
| Oxford Negro | 350 | Negro | 38–42 |
| Oxford Cafe | 300 | Cafe | 38–42 |
| Derby | 300 | Negro, Cafe | 38–42 |
| Viper | 320 | Cafe, Negro | 37–43 |

El usuario confirmo separar Oxford Negro y Oxford Cafe por la diferencia de precio, conservando la regla de precio unico por modelo. Tambien confirmo los colores de Luca y Shelby. Derby Clasico negro y Derby cafe se agrupan por modelo, precio y caracteristicas coincidentes; el archivo original permite revisar esa correspondencia. Las categorias agrupan botines, Oxford y Derby. Las distintas terminaciones de Shelby quedan indicadas en Otros detalles.

Ninguna imagen confirma existencias actuales. Las variantes importadas tienen `available=false` y `availabilityConfirmed=false`: se pueden seleccionar para consultar, pero no pasan el filtro de talla disponible. El panel permite confirmar disponible/agotado por combinacion. Las variantes anteriores conservan su disponibilidad y se migran como confirmadas.

## Importacion repetible

### Presentacion visual actualizada

Por correccion expresa del usuario, la interfaz utiliza negro, blanco y grises neutros, sin acentos cafe/bronce. Se conservan los colores naturales de las fotografias y el logotipo original. El inicio incorpora accesos a las categorias realmente publicadas y una seccion Nosotros ampliada con los datos proporcionados: emprendimiento boliviano, produccion y comercializacion de calzados de cuero y diseños en tendencia. No se afirman direcciones, antiguedad, envios ni garantias no confirmadas.

El listado publico muestra las **25 fotografias como presentaciones de 12 modelos**. Antes solo mostraba las 12 portadas; las demas fotos estaban dentro de las galerias. Cada tarjeta identifica su color y abre la foto correspondiente mediante `?foto=posicion`. Las tallas y el estado de la tarjeta corresponden al color mostrado; el filtro de talla disponible mantiene solo las presentaciones compatibles. La galeria completa sigue accesible en la ficha. Este ajuste no duplica productos ni modifica sus precios, variantes o registros en PostgreSQL.

La paleta se aplica en `frontend/src/app/commercial.css`; los textos compartidos de marca se mantienen en `frontend/src/lib/brand.ts`.

### Comando de importacion

Desde la raiz, con los servicios funcionando:

```powershell
docker compose exec backend npm run catalog:import -- --publish
```

Sin `--publish`, los modelos nuevos quedan retirados. Repetir el comando omite modelos con la misma `importKey`; conserva ediciones manuales, IDs, fotos, variantes y estados. `--update` actualiza datos comerciales desde el manifiesto y agrega variantes/fotos faltantes, conservando disponibilidad confirmada, fotos existentes y publicacion. No restablece productos eliminados. Revisar el manifiesto antes de usar esta opcion porque reemplaza los campos comerciales de los modelos importados.

`--retire-demos` retira los demostrativos solo cuando las 12 fichas importadas estan publicadas. No elimina registros. Las fotografias se identifican por hash y se cargan con la misma infraestructura de medios del panel. La importacion valida rutas, tamaños y hashes antes de escribir. Los archivos procesados estan incluidos en el backend: un clon puede recrear este catalogo importado sin recibir los volumenes originales. Las futuras fotos y ediciones manuales requieren un respaldo adicional.

Para reproducir las imagenes, con Python y Pillow instalados:

```powershell
python scripts/prepare-catalog.py
```

El almacenamiento actual es local persistente. Para Cloudinary, configurar `MEDIA_STORAGE=cloudinary` y las tres variables privadas existentes antes de subir nuevas fotos. No se inventan credenciales ni se trasladan automaticamente fotos locales; tampoco se eliminan recursos remotos al retirar o eliminar un producto.

## Datos y eliminacion

Migracion aditiva `202611220001_commercial_catalog`:

- Product: `importKey` unica, `details` opcional, `deletedAt` opcional.
- Variant: `availabilityConfirmed`, con restriccion que impide marcar disponible sin confirmar.
- Photo: `color` opcional para identificar la fotografia en la galeria.
- CatalogEvent: ID de evento, tipo, producto, talla/color opcionales, fecha. Relacion al producto sin borrado en cascada e indices por producto/fecha y fecha/tipo.
- EventGate: claves hash, contador y vencimiento para deduplicacion y limites temporales.

`DELETE /api/admin/products/:id` requiere sesion, origen valido y version vigente. Hace UPDATE de `deletedAt`, retira la publicacion e incrementa version. Los datos, variantes, fotos y eventos permanecen guardados. Se excluye el producto de listados activos, filtros, ficha, acceso publico a sus medios y nuevos eventos. Edicion/republicacion quedan bloqueadas. El panel diferencia Retirar (reversible) de Eliminar y exige confirmacion antes de enviar esta ultima accion.

## WhatsApp y estadisticas

`WHATSAPP_NUMBER=59176928024` es el numero de prueba configurable. El mensaje incluye modelo, referencia y solo las selecciones realizadas. La navegacion abre WhatsApp sin enviar mensajes automaticamente. El clic dispara un POST con `keepalive`; errores de estadisticas no bloquean el enlace.

Eventos: `PRODUCT_VIEW`, `COLOR_SELECT`, `SIZE_SELECT`, `WHATSAPP_CLICK`. El servidor valida que el producto siga publicado, no este eliminado y que la seleccion corresponda a una variante. No se almacenan nombres, correos, telefonos ni IP originales de visitantes. Las visitas de administradores autenticados se ignoran y los informes excluyen demostrativos.

- UUID de evento unico para reintentos concurrentes.
- Identificador aleatorio por sesion en `sessionStorage`, usado para una clave hash temporal; no representa personas unicas.
- Deduplicacion servidor y cliente: 5 minutos para vistas, 30 segundos para misma interaccion/producto/seleccion.
- Limites persistentes en PostgreSQL: 60 solicitudes/minuto por identificador y 600/minuto por conexion de ingreso. No se confia en cabeceras IP enviadas por el cliente. En la topologia proxy actual, el limite de ingreso puede ser compartido por visitantes. El hash IP usa sal aleatoria por proceso y cambia al reiniciar. Estos controles reducen abuso casual, no sustituyen proteccion perimetral en un despliegue publico.
- Eventos retenidos 365 dias; claves temporales vencidas limpiadas al iniciar y cada hora. La eliminacion logica conserva historial dentro de esta politica de retencion.

`GET /api/admin/statistics` requiere autenticacion. `/admin/estadisticas` muestra vistas, clics, rankings, barras por fecha, tallas, colores, variantes y tasa clics/vistas. Usa datos agregados de PostgreSQL; no genera numeros de ejemplo. Periodos de 7/30/90 dias o rango de hasta 366 dias, con dias calendario de Bolivia (UTC-4). Un clic no es una venta; una seleccion no confirma compra. La tasa puede exceder 100 % cuando hay varias consultas por vista y no equivale a conversion de ventas.

La pagina publica `/privacidad` explica estos registros. Las pruebas automatizadas usan fixtures marcados como demostracion al finalizar para no dejar cifras ficticias en los informes comerciales.

## Verificacion

El catalogo importado es la base de las pruebas de esta etapa. Las pruebas administrativas usan cuentas locales configuradas y crean fixtures propios, que retiran al finalizar. No deben ejecutarse contra un despliegue comercial con visitantes reales. El bloque de importacion contrasta los datos iniciales contra el manifiesto; una edicion comercial posterior puede cambiar esas expectativas sin representar un fallo del sistema.

```powershell
docker compose cp .work/accesos-locales.json backend:/tmp/topwalker-test-admins.json
docker compose exec backend chmod 600 /tmp/topwalker-test-admins.json
docker compose exec backend node --test --test-concurrency=1 test/admin.test.mjs test/catalog.test.mjs test/model.test.mjs test/commercial.test.mjs
cd frontend
npm.cmd run test:e2e
```

Los archivos de pruebas backend estan incluidos al construir la imagen; reconstruir si se modifican. Las credenciales temporales no se imprimen y desaparecen al recrear el contenedor. Las pruebas de navegador desactivan trazas y video cuando ingresan credenciales. El escenario publico intercepta la API de eventos para probar su caida y evitar datos de navegacion automatizada en los informes. El escenario comercial registra eventos reales de una fixture temporal y la marca como demostrativa antes de retirarla/eliminarla. WhatsApp se intercepta sin enviar mensajes.

`backend/scripts/check-persistence.cjs --capture` guarda una instantanea privada en el volumen local de imagenes. Sin ese argumento compara productos, variantes, fotos, eventos, cuentas (sin hashes de contraseña) y contenido SHA-256 de las imagenes tras reiniciar/recrear servicios. Ejecutar en un entorno sin escrituras simultaneas para que la comparacion exacta sea significativa.
