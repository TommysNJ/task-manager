import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/authorize";

// PATCH status - Actualizar el estado de una tarea
export async function PATCH(req, { params }) {
  const session = await authorize(req);
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  try {
    const body = await req.json();
    const { status } = body;

    const allowed = ["TODO", "IN_PROGRESS", "DONE"];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { message: "Estado inválido" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
    });

    if (!task) {
      return NextResponse.json(
        { message: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Reglas de negocio
    if (task.status === "DONE") {
      return NextResponse.json(
        { message: "La tarea ya está completada" },
        { status: 400 }
      );
    }

    if (task.status === "IN_PROGRESS" && status === "TODO") {
      return NextResponse.json(
        { message: "No se puede volver a TODO" },
        { status: 400 }
      );
    }

    const updated = await prisma.task.update({
      where: { id: Number(id) },
      data: { status },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error actualizando estado" },
      { status: 500 }
    );
  }
}

// DELETE - Borrar una tarea
export async function DELETE(req, { params }) {
  const session = await authorize(req);
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  try {
    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
    });

    if (!task) {
      return NextResponse.json(
        { message: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: { id: Number(id) },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error eliminando tarea" },
      { status: 500 }
    );
  }
}