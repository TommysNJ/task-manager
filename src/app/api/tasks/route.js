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