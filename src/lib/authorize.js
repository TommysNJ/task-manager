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