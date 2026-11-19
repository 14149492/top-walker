# TOP WALKER — INSTRUCCIONES PARA CODEX

## 1. Descripción del proyecto

Top Walker es una empresa boliviana dedicada a la fabricación y comercialización de calzados.

Actualmente promociona sus productos principalmente mediante campañas pagadas de Facebook y atiende consultas comerciales a través de Facebook y WhatsApp.

El objetivo del proyecto es desarrollar un sistema web de catálogo que permita:

- Ampliar la visibilidad de los productos.
- Reducir la dependencia de campañas publicitarias pagadas.
- Centralizar la información de los calzados.
- Facilitar la actualización de modelos, precios y disponibilidad.
- Reducir consultas repetitivas.
- Facilitar el contacto mediante WhatsApp.

El catálogo será público. Los clientes no tendrán que registrarse.

El propietario y su ayudante tendrán cuentas administrativas independientes y los mismos permisos.

## 2. Fuentes de información

Antes de implementar funcionalidades:

1. Revisar el contenido de `documentacion/`.
2. Analizar los requisitos funcionales y no funcionales.
3. Revisar las historias de usuario y sus criterios de aceptación.
4. Analizar los diagramas UML.
5. Revisar las imágenes de `imagenes de referencia/`.
6. Identificar contradicciones y decisiones pendientes.

El documento de requisitos es la referencia funcional principal.

Las imágenes proporcionadas son referencias visuales, no capturas de un sistema funcional.

En caso de contradicción:

- No inventar requisitos.
- Comunicar la contradicción.
- Proponer una solución justificada.
- Solicitar aprobación cuando afecte el alcance.

Si el PDF no puede leerse correctamente, informar el problema antes de continuar.

## 3. Arquitectura

Se utilizará arquitectura cliente-servidor de tres capas.

### Capa de presentación

Next.js + TypeScript + Tailwind CSS.

Responsabilidades:

- Página de inicio.
- Catálogo público.
- Buscador y filtros.
- Fichas de productos.
- Panel administrativo.
- Formularios de gestión.

### Capa de lógica de negocio

NestJS con API REST.

Responsabilidades:

- Autenticación y autorización.
- Validación de datos.
- Gestión de productos.
- Gestión de categorías.
- Gestión de disponibilidad.
- Gestión de publicación.
- Integración con almacenamiento de imágenes.

### Capa de datos

PostgreSQL con Prisma ORM.

Responsabilidades:

- Persistencia de productos.
- Categorías, tallas y colores.
- Disponibilidad.
- Referencias de fotografías.
- Usuarios administrativos.

Evitar consultas directas a PostgreSQL desde el navegador.

## 4. Stack tecnológico obligatorio

Frontend:

- Next.js con App Router.
- TypeScript.
- Tailwind CSS.

Backend:

- Node.js.
- NestJS.
- TypeScript.
- API REST.

Persistencia:

- PostgreSQL.
- Prisma ORM.
- Migraciones de base de datos.

Infraestructura:

- Docker.
- Docker Compose.
- Dockerfiles independientes.
- Variables de entorno.

Servicios complementarios:

- Cloudinary para fotografías, si se configuran credenciales.
- WhatsApp mediante enlaces de contacto.
- Git y GitHub para control de versiones.

Utilizar versiones estables compatibles entre sí.
Documentar las versiones seleccionadas.

No cambiar el stack sin autorización.

## 5. Docker y contenedores

## 5. Docker y contenedores

El proyecto Top Walker debe desarrollarse y ejecutarse utilizando
Docker y Docker Compose.

Codex será responsable de crear, configurar, construir, iniciar
y comprobar los contenedores necesarios para el sistema.

### Contenedores obligatorios

1. topwalker-frontend
   - Next.js + TypeScript + Tailwind CSS
   - Puerto local: 3000
   - Recarga automática durante desarrollo

2. topwalker-backend
   - NestJS + Prisma ORM
   - Puerto local: 3001
   - API REST
   - Comunicación interna con PostgreSQL

3. topwalker-db
   - PostgreSQL
   - Puerto interno: 5432
   - Volumen persistente para conservar los datos

### Responsabilidades de Codex

1. Crear los proyectos frontend y backend.
2. Crear los Dockerfiles correspondientes.
3. Crear el archivo compose.yaml.
4. Configurar las redes y volúmenes.
5. Crear .env.example con las variables necesarias.
6. Configurar la conexión de Prisma con PostgreSQL.
7. Instalar las dependencias necesarias.
8. Construir las imágenes Docker.
9. Crear e iniciar los tres contenedores.
10. Ejecutar las migraciones iniciales de Prisma.
11. Comprobar la conexión entre los servicios.
12. Verificar que los contenedores permanezcan funcionando.
13. Corregir los errores detectados.
14. Registrar los resultados en PROGRESS.md.

### Ejecución

Codex deberá ejecutar:

docker compose up --build -d

Después comprobar:

docker compose ps

docker compose logs --tail=100

### Condiciones de seguridad

- No eliminar contenedores ajenos a Top Walker.
- No borrar volúmenes existentes sin autorización.
- No ejecutar docker system prune automáticamente.
- No utilizar contraseñas reales en el repositorio.
- No ejecutar comandos destructivos sin aprobación.

### Resultado esperado

Al terminar, los siguientes servicios deberán funcionar:

Frontend:
http://localhost:3000

Backend:
http://localhost:3001

PostgreSQL:
Accesible desde el backend mediante db:5432.

No considerar completada esta etapa hasta haber comprobado
la ejecución real de los servicios.

## 6. Estructura del proyecto

Organizar inicialmente el repositorio así:

zapatos/
AGENTS.md
PROGRESS.md
README.md
compose.yaml
.env.example
.gitignore
documentacion/
imagenes de referencia/
frontend/
Dockerfile
.dockerignore
backend/
Dockerfile
.dockerignore

Respetar los nombres existentes de las carpetas.

No eliminar ni reemplazar los documentos o imágenes proporcionados.

No crear microservicios independientes.

El backend será un monolito modular basado en NestJS.

## 7. Requisitos funcionales

Implementar los requisitos definidos en el documento.

RF-01: Consultar el catálogo público.

RF-02: Visualizar detalles de un producto.

RF-03: Buscar productos por nombre o modelo.

RF-04: Filtrar productos por categoría y talla.

RF-05: Contactar mediante WhatsApp desde un producto.

RF-06: Iniciar y cerrar sesión administrativa.

RF-07: Registrar productos.

RF-08: Modificar información de productos.

RF-09: Publicar y retirar productos sin borrar sus registros.

RF-10: Actualizar tallas y disponibilidad.

Consultar la documentación para conocer las descripciones completas y los criterios de aceptación.

No considerar esta lista resumida como sustituto de la especificación formal.

## 8. Funcionalidades excluidas

No implementar:

- Carrito de compras.
- Pagos en línea.
- Registro de clientes.
- Historial de compras.
- Gestión de pedidos.
- Facturación.
- Control completo de inventario.
- Gestión de materias primas.
- Gestión de fabricación.
- Paneles de estadísticas no solicitados.

No introducir funcionalidades fuera del alcance para rellenar pantallas o demostrar más características.

## 9. Reglas del catálogo

Cada producto debe poder mostrar:

- Nombre o modelo.
- Descripción.
- Material.
- Fotografías.
- Precio en bolivianos (Bs).
- Colores.
- Tallas.
- Disponibilidad.
- Categoría.

Los productos retirados no aparecerán en el catálogo público.

Los administradores podrán seguir consultando los productos retirados.

El catálogo público solo mostrará información autorizada para publicación.

No asumir que se registrarán cantidades exactas de inventario.

Antes de cerrar el modelo de datos, confirmar:

- Disponibilidad por talla o combinación de talla y color.
- Precio único por modelo o precio por variante.
- Reglas de publicación.
- Organización de fotografías.

Estas decisiones deben documentarse.

## 10. Diseño de interfaces

Utilizar las imágenes de `imagenes de referencia/`.

La identidad visual será:

- Tema oscuro.
- Fondos negro y gris carbón.
- Acentos marrón, cobre o bronce.
- Tipografía moderna.
- Diseño elegante.
- Fotografías grandes.
- Interfaz adaptable a dispositivos móviles.

Mantener consistencia entre las pantallas.

El frontend deberá incluir:

- Inicio.
- Catálogo.
- Detalle del producto.
- Contacto.
- Inicio de sesión administrativo.
- Panel administrativo.
- Gestión de productos.

No copiar literalmente sitios web de otras marcas.

No utilizar imágenes ficticias como productos reales de Top Walker.

Los productos de prueba deben identificarse como demostrativos.

## 11. Seguridad

Aplicar controles de seguridad desde el backend.

Requisitos:

- Contraseñas almacenadas mediante hashes seguros.
- Autenticación de administradores.
- Autorización de operaciones.
- Validación de entradas.
- Protección de rutas administrativas.
- Gestión segura de sesiones.
- Manejo controlado de errores.
- No exponer secretos en el frontend.
- No incluir credenciales reales en el repositorio.

No considerar una ruta oculta como medida suficiente de seguridad.

Las cuentas del propietario y su ayudante tendrán los mismos permisos administrativos.

## 12. Calidad del código

- Utilizar TypeScript.
- Mantener responsabilidades separadas.
- Crear componentes reutilizables.
- Evitar duplicación de código.
- Mantener nombres claros y descriptivos.
- Organizar NestJS mediante módulos, controladores y servicios.
- Utilizar Prisma desde la capa de acceso a datos.
- Validar datos desde el backend.
- Implementar manejo de errores.
- Utilizar identificadores estables para los productos.
- Documentar decisiones importantes.

No instalar dependencias innecesarias.

No modificar archivos ajenos a la tarea sin justificación.

## 13. Pruebas y verificación

Después de implementar cada funcionalidad:

1. Comprobar que el proyecto compila.
2. Ejecutar lint y comprobaciones de tipos.
3. Ejecutar pruebas disponibles.
4. Comprobar la integración entre servicios.
5. Verificar que el catálogo obtiene datos de PostgreSQL.
6. Verificar que los cambios administrativos persisten.
7. Probar autorización administrativa.
8. Comprobar la navegación pública.
9. Verificar el comportamiento responsive.

No afirmar que algo funciona si no se ha probado.

Informar los errores pendientes.

## 14. Seguimiento

Mantener actualizado `PROGRESS.md`.

Registrar:

- Funcionalidades implementadas.
- Historias de usuario relacionadas.
- Archivos relevantes.
- Pruebas realizadas.
- Errores conocidos.
- Funcionalidades pendientes.
- Decisiones técnicas tomadas.

Al finalizar cada tarea, explicar brevemente:

- Qué se desarrolló.
- Qué archivos se modificaron.
- Qué pruebas se ejecutaron.
- Qué queda pendiente.

No sobrescribir avances funcionales sin necesidad.

## 15. Prioridades del desarrollo

Priorizar un MVP demostrable.

Fase 1:

- Estructura del proyecto.
- Contenedores Docker.
- Conexión a PostgreSQL.
- Migraciones iniciales.
- Datos de demostración.

Fase 2:

- Página de inicio.
- Catálogo.
- Fichas de productos.
- Búsqueda y filtros.

Fase 3:

- Autenticación administrativa.
- Panel administrativo.
- Registro y modificación de productos.
- Gestión de disponibilidad.

Fase 4:

- Contacto por WhatsApp.
- Imágenes.
- Pruebas de integración.
- Correcciones visuales.
- Preparación de despliegue.

El desarrollo debe producir funcionalidades ejecutables, no solamente documentación o maquetas.

## 16. Forma de trabajo con Codex

Antes de comenzar:

1. Leer este archivo.
2. Revisar la documentación.
3. Analizar las imágenes de referencia.
4. Revisar el contenido existente del repositorio.
5. Identificar decisiones pendientes.

Durante el desarrollo:

- Trabajar por etapas pequeñas y verificables.
- Implementar directamente cuando el alcance esté claro.
- No realizar cambios destructivos.
- Mantener actualizado el progreso.
- Explicar las decisiones arquitectónicas relevantes.
- Utilizar Docker como entorno principal.
- Evitar introducir componentes fuera del alcance.

Si aparece un error:

1. Identificar la causa.
2. Proponer una corrección.
3. Aplicarla si no afecta decisiones importantes.
4. Ejecutar nuevamente las pruebas.
5. Registrar problemas no resueltos.

## 17. Objetivo de la primera entrega

Obtener una versión funcional y visualmente cercana al producto final.

La demostración debe permitir:

1. Abrir la página de Top Walker.
2. Navegar por el catálogo.
3. Consultar un calzado.
4. Buscar o filtrar productos.
5. Acceder como administrador.
6. Modificar un producto.
7. Comprobar que el cambio aparece en el catálogo.

Priorizar una aplicación que funcione de extremo a extremo.

No dar por terminada una funcionalidad cuando únicamente exista su interfaz visual.
