"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  async function generarToken() {
    await fetch("/api/auth/login", { method: "POST" });
    alert("Token generado");
  }

  async function entrar() {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      router.push("/dashboard/tasks");
    } else {
      alert("Primero genera el token");
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-left">
        <div className="login-form">
          <h2 className="login-title">Task Manager</h2>

          <button className="btn-primary" onClick={generarToken}>
            Generar JWT
          </button>

          <br /><br />

          <button className="btn-primary" onClick={entrar}>
            Ingresar
          </button>
        </div>
      </div>

      <div className="login-right"></div>
    </div>
  );
}