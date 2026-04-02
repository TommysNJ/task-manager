import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorize";

export async function GET(req) {
  const session = getSession(req);

  if (!session) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  return NextResponse.json(session);
}