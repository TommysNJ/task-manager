"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";

export default function Home() {
  const router = useRouter();

  const [tokenModal, setTokenModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);

  async function generarToken() {
    await fetch("/api/auth/login", { method: "POST" });
    setTokenModal(true);
  }

  async function entrar() {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      router.push("/dashboard/tasks");
    } else {
      setErrorModal(true);
    }
  }

  return (
    <>
        {/* Contenedor centrado */}
      <div className="login-center">
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

      {/* MODAL TOKEN */}
      {tokenModal &&
        createPortal(
          <div className="modal">
            <div className="modal-content delete-content">
              <h3>✅ Token generado correctamente</h3>
              <button
                className="submit-btn"
                onClick={() => setTokenModal(false)}
              >
                OK
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL ERROR */}
      {errorModal &&
        createPortal(
          <div className="modal">
            <div className="modal-content delete-content">
              <h3>⚠️ Primero debes generar el token</h3>
              <button
                className="submit-btn"
                onClick={() => setErrorModal(false)}
              >
                OK
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}