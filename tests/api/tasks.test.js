/**
 * Test de integración – /api/tasks  (GET y POST)
 *
 * Estrategia:
 *  - Se importan directamente los handlers de Next.js (GET, POST).
 *  - Se mockean prisma y authorize para aislar la lógica del endpoint
 *    sin levantar servidor ni tocar la base de datos real.
 *  - Cada test construye un Request nativo de Node/Web API,
 *    igual al que recibe Next.js en producción.
 */

// Mock de Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock de authorize
jest.mock("@/lib/authorize", () => ({
  authorize: jest.fn(),
}));

// Imports 

const { GET, POST } = require("@/app/api/tasks/route");
const { prisma } = require("@/lib/prisma");
const { authorize } = require("@/lib/authorize");
const { NextResponse } = require("next/server");

// Helpers 

/**
 * Crea un Request compatible con Next.js App Router.
 * @param {string} path   - ruta relativa, ej: "/api/tasks?status=TODO"
 * @param {object} opts   - opciones fetch estándar (method, body, headers, cookies)
 */
function makeRequest(path = "/api/tasks", opts = {}) {
  const url = `http://localhost:3000${path}`;
  const { cookies = {}, ...fetchOpts } = opts;

  const req = new Request(url, fetchOpts);

  // Next.js expone cookies a través de req.cookies.get(name)
  req.cookies = {
    get: (name) =>
      cookies[name] !== undefined ? { value: cookies[name] } : undefined,
  };

  return req;
}

// Extrae el body JSON de un NextResponse 
async function json(response) {
  return response.json();
}

// Suite GET /api/tasks

describe("GET /api/tasks", () => {
  beforeEach(() => jest.clearAllMocks());

  test("200 – devuelve lista de tareas sin filtro", async () => {
    const mockTasks = [
      {
        id: 1,
        title: "Tarea A",
        description: "desc",
        assignee: "Ana",
        status: "TODO",
        createdAt: "2024-01-01T00:00:00.000Z",
        dueDate: null,
      },
    ];

    prisma.task.findMany.mockResolvedValue(mockTasks);

    const req = makeRequest("/api/tasks");
    const res = await GET(req);
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body).toEqual(mockTasks);

    // Sin filtro - where debe estar vacío
    expect(prisma.task.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: "desc" },
    });
  });

  test("200 – filtra por status=TODO", async () => {
    prisma.task.findMany.mockResolvedValue([]);

    const req = makeRequest("/api/tasks?status=TODO");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(prisma.task.findMany).toHaveBeenCalledWith({
      where: { status: "TODO" },
      orderBy: { createdAt: "desc" },
    });
  });

  test("200 – filtra por status=IN_PROGRESS", async () => {
    prisma.task.findMany.mockResolvedValue([]);

    const req = makeRequest("/api/tasks?status=IN_PROGRESS");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(prisma.task.findMany).toHaveBeenCalledWith({
      where: { status: "IN_PROGRESS" },
      orderBy: { createdAt: "desc" },
    });
  });

  test("200 – filtra por status=DONE", async () => {
    prisma.task.findMany.mockResolvedValue([]);

    const req = makeRequest("/api/tasks?status=DONE");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(prisma.task.findMany).toHaveBeenCalledWith({
      where: { status: "DONE" },
      orderBy: { createdAt: "desc" },
    });
  });

  test("400 – status inválido es rechazado", async () => {
    const req = makeRequest("/api/tasks?status=INVALIDO");
    const res = await GET(req);
    const body = await json(res);

    expect(res.status).toBe(400);
    expect(body.message).toBe("Status inválido");
    expect(prisma.task.findMany).not.toHaveBeenCalled();
  });

  test("500 – error interno devuelve 500", async () => {
    prisma.task.findMany.mockRejectedValue(new Error("DB error"));

    const req = makeRequest("/api/tasks");
    const res = await GET(req);
    const body = await json(res);

    expect(res.status).toBe(500);
    expect(body.message).toBe("Error interno al obtener tareas");
  });
});

// Suite POST /api/tasks 

describe("POST /api/tasks", () => {
  beforeEach(() => jest.clearAllMocks());

  // Autenticación

  test("401 – sin cookie devuelve no autenticado", async () => {
    // authorize devuelve un NextResponse cuando falla
    authorize.mockResolvedValue(
      NextResponse.json({ message: "No autenticado" }, { status: 401 })
    );

    const req = makeRequest("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "T", assignee: "A" }),
    });

    const res = await POST(req);
    const body = await json(res);

    expect(res.status).toBe(401);
    expect(body.message).toBe("No autenticado");
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  test("401 – token inválido devuelve 401", async () => {
    authorize.mockResolvedValue(
      NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 })
    );

    const req = makeRequest("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "T", assignee: "A" }),
      cookies: { auth_token: "token_malo" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  // Validaciones

  test("400 – falta title", async () => {
    authorize.mockResolvedValue({ userId: 1, email: "user@test.com" });

    const req = makeRequest("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignee: "Ana" }),
      cookies: { auth_token: "token_valido" },
    });

    const res = await POST(req);
    const body = await json(res);

    expect(res.status).toBe(400);
    expect(body.message).toMatch(/title/);
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  test("400 – falta assignee", async () => {
    authorize.mockResolvedValue({ userId: 1, email: "user@test.com" });

    const req = makeRequest("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Mi tarea" }),
      cookies: { auth_token: "token_valido" },
    });

    const res = await POST(req);
    const body = await json(res);

    expect(res.status).toBe(400);
    expect(body.message).toMatch(/assignee/);
  });

  test("400 – title supera 120 caracteres", async () => {
    authorize.mockResolvedValue({ userId: 1, email: "user@test.com" });

    const req = makeRequest("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "a".repeat(121), assignee: "Ana" }),
      cookies: { auth_token: "token_valido" },
    });

    const res = await POST(req);
    const body = await json(res);

    expect(res.status).toBe(400);
    expect(body.message).toMatch(/120/);
  });

  // Creación exitosa 

  test("201 – crea tarea con datos mínimos (sin dueDate ni description)", async () => {
    authorize.mockResolvedValue({ userId: 1, email: "user@test.com" });

    const createdTask = {
      id: 10,
      title: "Nueva tarea",
      description: null,
      assignee: "Carlos",
      status: "TODO",
      dueDate: null,
      createdAt: new Date().toISOString(),
    };

    prisma.task.create.mockResolvedValue(createdTask);

    const req = makeRequest("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nueva tarea", assignee: "Carlos" }),
      cookies: { auth_token: "token_valido" },
    });

    const res = await POST(req);
    const body = await json(res);

    expect(res.status).toBe(201);
    expect(body).toEqual(createdTask);
    expect(prisma.task.create).toHaveBeenCalledTimes(1);

    const callArg = prisma.task.create.mock.calls[0][0].data;
    expect(callArg.title).toBe("Nueva tarea");
    expect(callArg.assignee).toBe("Carlos");
    expect(callArg.dueDate).toBeNull();
  });

  test("201 – crea tarea con todos los campos", async () => {
    authorize.mockResolvedValue({ userId: 1, email: "user@test.com" });

    const payload = {
      title: "Tarea completa",
      description: "Una descripción detallada",
      assignee: "Laura",
      dueDate: "2025-12-31",
    };

    const createdTask = {
      id: 11,
      ...payload,
      dueDate: new Date("2025-12-31").toISOString(),
      status: "TODO",
      createdAt: new Date().toISOString(),
    };

    prisma.task.create.mockResolvedValue(createdTask);

    const req = makeRequest("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cookies: { auth_token: "token_valido" },
    });

    const res = await POST(req);
    const body = await json(res);

    expect(res.status).toBe(201);
    expect(body.title).toBe("Tarea completa");
    expect(body.assignee).toBe("Laura");

    const callArg = prisma.task.create.mock.calls[0][0].data;
    expect(callArg.dueDate).toBeInstanceOf(Date);
    expect(callArg.description).toBe("Una descripción detallada");
  });

  // Error interno 

  test("500 – error de Prisma devuelve 500", async () => {
    authorize.mockResolvedValue({ userId: 1, email: "user@test.com" });
    prisma.task.create.mockRejectedValue(new Error("DB error"));

    const req = makeRequest("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "T", assignee: "A" }),
      cookies: { auth_token: "token_valido" },
    });

    const res = await POST(req);
    const body = await json(res);

    expect(res.status).toBe(500);
    expect(body.message).toBe("Error interno al crear tarea");
  });
});