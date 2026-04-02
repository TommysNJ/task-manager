# HERRAMIENTA UTILIZADA: CHATGPT

## ENTRADA #1
**Prompt Enviado:**
Estoy realizando un proyecto en next.js y estoy haciendo la estructura de datos con prisma como ORM. Actualmente tengo la estructura como la que te voy a enviar pero me dice que hay un problema con el atributo title.

generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
enum Status {
  TODO
  IN_PROGRESS
  DONE
}
model Task {
  id          Int      @id @default(autoincrement())
  title       String   @db.VarChar(120)
  description String?
  assignee    String
  status      Status   @default(TODO)
  createdAt   DateTime @default(now())
  dueDate     DateTime?
}

**Problema Encontrado:**
La IA comentó que el atributo @db.VarChar(120) solo funciona con ciertos proveedores de bases de datos, como MySQL o PostgreSQL, pero no con SQLite. SQLite no reconoce VARCHAR(120) de esa forma, y Prisma por eso marcó el error.

**Corrección Aplicada:**
Se definió el campo como String sin @db.VarChar:
model Task {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  assignee    String
  status      Status   @default(TODO)
  createdAt   DateTime @default(now())
  dueDate     DateTime?
}

## ENTRADA #2
**Prompt Enviado:**
Tengo otro problema con un codigo en el backend node.js.
Actualmente yo creo tareas que contienen un atributo que registra la fecha cuando se crea: createdAt.

Estoy utilizando prisma como orm con sqlite. 

El problema es que cuando creo una tarea ahorita a las 10 pm de la noche, se debería crear con fecha de hoy, pero se crea con la fecha de mañana. Esto es porque se suman 5 horas a esa fecha por lo que estoy en ecuador, como puedo hacer para solucionar esto y que mi fecha se ponga correctamente?
Te mando el codigo que tengo, revisalo bien, no elimines nada de lo que ya esta. Solo agrega eso o modifica lo necesario.

* Código del endpoint adjunto

**Problema Encontrado:**
Es un tema clásico de timezone. Prisma y SQLite almacenan las fechas como UTC por defecto. Cuando se hace new Date() en Node.js, Node crea la fecha en hora local, pero SQLite/Prisma luego la interpreta como UTC al guardarla. Por eso en Ecuador (UTC-5) si se crea algo a las 10 pm, termina como 3 am del día siguiente en UTC.

Lo bueno es que no necesitas cambiar toda tu lógica, solo convertir la fecha a UTC “correcta” antes de guardarla o manipularla al crear la tarea.

**Corrección Aplicada:**
Se modificó el POST /api/tasks para que la hora se ponga correctamente de Ecuador y por lo tanto no cambie de fecha:
// Fecha local
const nowLocal = new Date();
const offset = nowLocal.getTimezoneOffset(); // en minutos
const createdAtLocal = new Date(nowLocal.getTime() - offset * 60 * 1000);


## ENTRADA #3
**Prompt Enviado:**
Tengo otro problema con mi proyecto next.js que lo estoy haciendo con node.js y react. Tengo una carpeta dentro de src/app en donde estoy poniendo los estilos. Pero no me funcionan, en que archivo debo importar estos archivos para que valga para todo el proyecto?

**Problema Encontrado:**
En Next.js, los estilos globales solo se pueden importar en src/app/layout.jsx (o layout.tsx). Si se pone los CSS en otra carpeta dentro de app/, no basta con importarlos en cada componente, porque Next.js bloquea imports globales fuera de layout.js.

**Corrección Aplicada:**
Se importó los estilos en src/app/layout.jsx:
import "@/styles/globals.css";
import "@/styles/tasks.css";


## ENTRADA #4
**Prompt Enviado:**
Tengo otro problema. Implementé un middleware, el cual lo puse dentro de src a la altura de las carpetas app, lib, styles. Sin embargo, no esta funcionando, no se porque. no me permite navegar a la siguiente pagina y tampoco sirve para redireccionar.

tengo esto, falta algo?
import { NextResponse } from "next/server";
import { verifyAuthToken } from "./lib/jwt";

export const config = {
  matcher: ["/dashboard/:path*"],
};

export function middleware(req) {
  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const session = verifyAuthToken(token);

  if (!session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

**Problema Encontrado:**
Por defecto Next.js ejecuta los middlewares en Edge Runtime, lo cual es rápido, pero algunas cosas de Node.js no funcionan, como acceso a la mayoría de módulos de Node (por ejemplo fs, ciertas librerías de JWT si usan crypto nativo, etc).
Alternativa: si el middleware necesita el entorno completo de Node.js, debes especificarlo con:

runtime: "nodejs"

**Corrección Aplicada:**
Se investigó en la documentación sobre esto y se confirmó, haciéndolo de la siguiente manera:

export const runtime = "nodejs";

export const config = {
  matcher: ["/dashboard/:path*"],
};


# HERRAMIENTA UTILIZADA: CHATGPT
## ENTRADA #5
## ENTRADA #3
**Prompt Enviado:**
Hola, estoy haciendo una proyecto en next.js con node.js y react. Necesito hacer un test de integración del endpoint que te voy a mandar, estoy trabajando con la carpeta src.

src/app/api/tasks/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/authorize";
// GET /api/tasks - listar todas las tareas
export async function GET(req) {
try {
const { searchParams } = new URL(req.url);
const status = searchParams.get("status");
const where = {};
if (status) {
const allowed = ["TODO", "IN_PROGRESS", "DONE"];
if (!allowed.includes(status)) {
return NextResponse.json(
          { message: "Status inválido" },
          { status: 400 }
        );
      }
      where.status = status;
    }
const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error(error);
return NextResponse.json(
      { message: "Error interno al obtener tareas" },
      { status: 500 }
    );
  }
}
// POST /api/tasks - Crear una tarea
export async function POST(req) {
const session = await authorize(req);
if (session instanceof NextResponse) return session;
try {
const body = await req.json();
const { title, description, assignee, dueDate } = body;
// Validaciones
if (!title || !assignee) {
return NextResponse.json(
        { message: "Campos obligatorios faltantes: title, assignee" },
        { status: 400 }
      );
    }
if (title.length > 120) {
return NextResponse.json(
        { message: "El título no puede superar 120 caracteres" },
        { status: 400 }
      );
    }
// Fecha local
const nowLocal = new Date();
const offset = nowLocal.getTimezoneOffset(); // en minutos
const createdAtLocal = new Date(nowLocal.getTime() - offset * 60 * 1000);
const task = await prisma.task.create({
      data: {
        title,
        description,
        assignee,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdAt: createdAtLocal,
      },
    });
return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error(error);
return NextResponse.json(
      { message: "Error interno al crear tarea" },
      { status: 500 }
    );
  }
}

src/app/dasbhoard/tasks/page.jsx

src/lib/authorize.js
import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/jwt";
export function getSession(req) {
const token = req.cookies.get("auth_token")?.value;
if (!token) return null;
return verifyAuthToken(token);
}
export async function authorize(req) {
const token = req.cookies.get("auth_token")?.value;
if (!token) {
return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
const session = verifyAuthToken(token);
if (!session) {
return NextResponse.json(
      { message: "Token inválido o expirado" },
      { status: 401 }
    );
  }
return session;
}

src/lib/jwt.js
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const TOKEN_TTL = "8h";
export function signAuthToken(payload) {
return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}
export function verifyAuthToken(token) {
try {
return jwt.verify(token, JWT_SECRET);
  } catch {
return null;
  }
}

src/lib/prisma.js
// lib/prisma.js
import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis;
export const prisma =
  globalForPrisma.prisma ||
new PrismaClient({
    log: ['error', 'warn'],
  });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

package.json
{
  "name": "task-manager",
"version": "0.1.0",
"private": true,
"scripts": {
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "eslint",
"test": "jest"
  },
"dependencies": {
"@prisma/client": "^6.17.0",
"jsonwebtoken": "^9.0.3",
"next": "16.2.2",
"react": "19.2.4",
"react-dom": "19.2.4"
  },
"devDependencies": {
"@babel/core": "^7.29.0",
"@babel/preset-env": "^7.29.2",
"@types/jest": "^30.0.0",
"babel-jest": "^30.3.0",
"eslint": "^9",
"eslint-config-next": "16.2.2",
"jest": "^30.3.0",
"prisma": "^6.17.0",
"supertest": "^7.2.2"
  }
}

Ayudame hacerlo, ya me creé una carpeta a la altura de src para poner el test dentro.

**Problema Encontrado:**
Con el código que se compartió se creó el test de integración para el endpoint GET y POST de /api/tasks.
La estrategia fue:
- Mockear Prisma para no tocar la base de datos real
- Mockear authorize para controlar autenticación
- Usar node-mocks-http o simplemente construir el Request de Next.js directamente, sin levantar servidor (test unitario de integración sobre los handlers).

Además, se generó los archivos de configuración de jest.config.js y babel.config.test.js.

**Corrección Aplicada:**
Se configuró los archivos jest y babel para la ejecución de pruebas. Se revisó el código generado para tasks.test.js y se confirmó que se testeó los respectivos endpoints. 
Al implementar el código revisado, se ejecutó correctamente y se pasó con éxito los 14 tests. 