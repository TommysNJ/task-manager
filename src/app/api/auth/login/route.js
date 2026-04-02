import { NextResponse } from "next/server";
import { signAuthToken } from "@/lib/jwt";

// Creación del token para autenticación
export async function POST() {
  const token = signAuthToken({ user: "demo" });

  const res = NextResponse.json({ message: "ok" });

  res.cookies.set("auth_token", token, {
    httpOnly: true,
    path: "/",
  });

  return res;
}