# Task Manager

Aplicación web de gestión de tareas construida con Next.js, React y Prisma. Permite crear, listar, actualizar el estado y eliminar tareas, con autenticación basada en JWT.

## Tecnologías utilizadas

- **Next.js 16.2.2** - Framework fullstack con App Router
    - **Node.js** - runtime del servidor, maneja toda la lógica del backend a través de las Route Handlers de Next.js.
    - **React 19.2.4** — interfaz de usuario

- **Prisma 6.17.0** — ORM para la base de datos
- **SQLite** — base de datos local
- **jsonwebtoken 9.0.3** — autenticación mediante JWT
- **Jest 30.x + Babel** — testing

## Estructura del proyecto

- task-manager/
    - src/
        - app/
            - api/
                - tasks/
                    - route.js          # GET /api/tasks, POST /api/tasks
                    - [id]/
                        - route.js      # PATCH /api/tasks/:id, DELETE /api/tasks/:id
            - dashboard/
                - tasks/
                    - page.jsx          # Vista principal de tareas
        - lib/
            - authorize.js              # Middleware de autenticación
            - jwt.js                    # Sign y verify de tokens JWT
            - prisma.js                 # Cliente Prisma (singleton)
        - styles/
            - global.css
            - tasks.css
        - middleware.js                 # Protección de rutas /dashboard/*
    - tests/
        - api/
            - tasks.test.js             # Tests de integración del endpoint /api/tasks
    - prisma/
        - schema.prisma                 # Esquema de la base de datos
    - babel.config.test.js              # Config de Babel exclusiva para Jest
    - jest.config.js                    # Configuración de Jest
    - env                              # Variables de entorno
    - package.json

## Requisitos previos

- Node.js v18 o superior
- npm v9 o superior

Verifica tu versión con:
node -v
npm -v

## Instalación y puesta en marcha

### 1. Clonar el repositorio

git clone <url-del-repositorio>
cd task-manager

### 2. Instalar dependencias

npm install

### 3. Generar el cliente de Prisma

- npx prisma generate
- npx prisma migrate dev --name init

### 4. Levantar el servidor de desarrollo

npm run dev

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Comandos disponibles

- `npm run dev` — inicia el servidor en modo desarrollo con hot reload
- `npm run build` — genera el build de producción
- `npm run start` — inicia el servidor en modo producción (requiere build previo)
- `npm test` — ejecuta los tests de integración

## API — Endpoints

Todos los endpoints de escritura (`POST`, `PATCH`, `DELETE`) requieren autenticación mediante una cookie `auth_token` con un JWT válido.

### `GET /api/tasks`

Lista todas las tareas. Acepta un filtro opcional por estado mediante el query param `?status=` con los valores `TODO`, `IN_PROGRESS` o `DONE`.

Respuestas posibles:
- `200` — lista de tareas en formato JSON
- `400` — status inválido
- `500` — error interno del servidor

### `POST /api/tasks`

Crea una nueva tarea. Requiere autenticación.

Body JSON:
{
  "title": "Nombre de la tarea",
  "assignee": "Nombre del responsable",
  "description": "Descripción opcional",
  "dueDate": "2025-12-31"
}

Campos:
- `title` — requerido, máximo 120 caracteres
- `assignee` — requerido
- `description` — opcional
- `dueDate` — opcional, formato `YYYY-MM-DD`

Respuestas posibles:
- `201` — tarea creada
- `400` — campos obligatorios faltantes o título demasiado largo
- `401` — no autenticado o token inválido
- `500` — error interno del servidor

### `PATCH /api/tasks/:id`

Actualiza el estado de una tarea. Requiere autenticación.

Body JSON:

{
  "status": "IN_PROGRESS"
}

Reglas de negocio:
- Una tarea en estado `DONE` no puede modificarse
- Una tarea en estado `IN_PROGRESS` no puede volver a `TODO`

Respuestas posibles:
- `200` — tarea actualizada
- `400` — estado inválido o transición no permitida
- `401` — no autenticado
- `404` — tarea no encontrada
- `500` — error interno del servidor

### `DELETE /api/tasks/:id`

Elimina una tarea. Requiere autenticación.

Respuestas posibles:
- `204` — tarea eliminada correctamente (sin body)
- `401` — no autenticado
- `404` — tarea no encontrada
- `500` — error interno del servidor

## Modelo de datos

model task {
  id          Int       @id @default(autoincrement())
  title       String
  description String?
  assignee    String
  status      status    @default(TODO)
  createdAt   DateTime  @default(now())
  dueDate     DateTime?
}

enum status {
  TODO
  IN_PROGRESS
  DONE
}

## Autenticación

La autenticación se realiza mediante JWT almacenado en una cookie `auth_token`. El middleware de Next.js (`src/middleware.js`) protege automáticamente todas las rutas bajo `/dashboard/*`, redirigiendo a `/` si el token no existe o expiró. El token tiene una duración de 8 horas.

## Tests

Los tests de integración cubren los endpoints `GET /api/tasks` y `POST /api/tasks`. Prisma y el módulo de autenticación son mockeados para aislar la lógica sin depender de la base de datos real.

Para ejecutarlos: npm test

Casos cubiertos (14 tests):
- `GET` — lista sin filtro
- `GET` — filtro por `TODO`, `IN_PROGRESS` y `DONE`
- `GET` — rechazo de status inválido
- `GET` — error interno de base de datos
- `POST` — sin cookie de autenticación
- `POST` — token inválido o expirado
- `POST` — falta el campo `title`
- `POST` — falta el campo `assignee`
- `POST` — título supera los 120 caracteres
- `POST` — creación exitosa con datos mínimos
- `POST` — creación exitosa con todos los campos
- `POST` — error interno de base de datos

> Los `console.error` que aparecen al correr los tests de error 500 son esperados: provienen del `catch` del propio `route.js` al recibir el error simulado.
