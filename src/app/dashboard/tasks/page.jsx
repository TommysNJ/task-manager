"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "@/styles/tasks.css";

export default function TasksPage() {
  // Lista de tareas y filtro por estado
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");

  // Estados de los modales
  const [createModal, setCreateModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [doneModal, setDoneModal] = useState({ open: false, item: null });

  // Formulario de creación de tareas
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignee: "",
    dueDate: "",
  });

  // Errores del formulario o acciones
  const [errors, setErrors] = useState({});

  // Carga las tareas desde el backend (filtro opcional)
  async function load() {
    const url = statusFilter
      ? `/api/tasks?status=${statusFilter}`
      : "/api/tasks";

    const res = await fetch(url);
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  // Crear nueva tarea
  async function createTask() {
    setErrors({});

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setCreateModal(false);
      setSuccessModal(true);
      setForm({ title: "", description: "", assignee: "", dueDate: "" });
      setErrors({});
      load();
    } else {
      const data = await res.json();
      const msg = data.message || "Error";

      const newErrors = {};

      // Mapear errores desde backend
      if (msg.includes("title")) newErrors.title = true;
      if (msg.includes("assignee")) newErrors.assignee = true;

      setErrors({ ...newErrors, general: msg });
    }
  }

  // Determina la clase de badge según estado
  function getBadgeClass(status) {
    if (status === "IN_PROGRESS") return "badge-en-proceso";
    if (status === "DONE") return "badge-completado";
    return "";
  }

  // Cambio de estado de tarea
  async function changeStatus(item, status) {
    if (status === "DONE") {
      setDoneModal({ open: true, item }); // abrir modal de DONE
      return;
    }
    await updateStatus(item, status);
  }

  // Actualiza el estado en el backend
  async function updateStatus(item, status) {
    const res = await fetch(`/api/tasks/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      load();
    } else {
      const data = await res.json();
      setErrors({ general: data.message || "Error" });
    }
  }

  // Confirmar cambio a DONE
  async function confirmDone() {
    await updateStatus(doneModal.item, "DONE");
    setDoneModal({ open: false, item: null });
  }

  // Confirmar eliminación de tarea
  async function confirmDelete() {
    const res = await fetch(`/api/tasks/${deleteModal.id}`, {
      method: "DELETE",
    });

    if (res.status === 204) load();
    else {
      const data = await res.json();
      setErrors({ general: data.message || "Error eliminando" });
    }

    setDeleteModal({ open: false, id: null });
  }

  return (
    <div className="main-content-inner">
      <div className="filter-panel">
        <div className="search-group">
            {/* Filtro por estado */}
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>

          <button className="create-btn" onClick={() => setCreateModal(true)}>
            Crear Tarea
          </button>
        </div>
      </div>

      {/* Tabla de tareas */}
      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>Id</th>  
              <th>Título</th>
              <th>Descripción</th>
              <th>Asignado</th>
              <th>Estado</th>
              <th>Fecha creación</th>
              <th>Fecha límite</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td title={t.title}><div>{t.title}</div></td>
                <td title={t.description}><div>{t.description || "-"}</div></td>
                <td>{t.assignee}</td>

                <td>
                  <select
                    className={`input ${getBadgeClass(t.status)}`}
                    value={t.status}
                    disabled={t.status === "DONE"}
                    onChange={(e) => changeStatus(t, e.target.value)}
                  >
                    {t.status === "TODO" && <option value="TODO">TODO</option>}
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="DONE">DONE</option>
                  </select>
                </td>

                <td>{t.createdAt?.split("T")[0]}</td>
                <td>{t.dueDate?.split("T")[0] || "-"}</td>

                <td className="actions">
                  <button
                    onClick={() =>
                      setDeleteModal({ open: true, id: t.id })
                    }
                  >
                    ✖
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para crear tarea */}
      {createModal &&
        createPortal(
          <div className="modal">
            <div className="modal-content">
              <button
                className="close-btn"
                onClick={() => {
                  setCreateModal(false);
                  setErrors({});
                }}
              >
                ×
              </button>

              <h3>Crear tarea</h3>

              <div className="form-group">
                <input
                  className={`input ${errors.title ? "input-error" : ""}`}
                  placeholder="Título"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <input
                  className={`input ${errors.assignee ? "input-error" : ""}`}
                  placeholder="Asignado"
                  value={form.assignee}
                  onChange={(e) =>
                    setForm({ ...form, assignee: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <textarea
                  className="input"
                  placeholder="Descripción"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <input
                  type="date"
                  className="input"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>

              {errors.general && (
                <p className="error-text" style={{ textAlign: "center" }}>
                  {errors.general}
                </p>
              )}

              <button className="submit-btn" onClick={createTask}>
                Crear
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Modal para confirmar creación de tarea */}
      {successModal &&
        createPortal(
          <div className="modal">
            <div className="modal-content delete-content">
              <h3>✅ Tarea creada correctamente</h3>
              <button
                className="submit-btn"
                onClick={() => setSuccessModal(false)}
              >
                OK
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Modal para confirmar la eliminación de una tarea */}
      {deleteModal.open &&
        createPortal(
          <div className="modal delete-modal">
            <div className="modal-content delete-content">
              <h3>¿Eliminar tarea?</h3>
              <div className="delete-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => setDeleteModal({ open: false, id: null })}
                >
                  Cancelar
                </button>
                <button className="confirm-btn" onClick={confirmDelete}>
                  Confirmar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal para confirmar el estado DONE de una tarea */}
      {doneModal.open &&
        createPortal(
          <div className="modal delete-modal">
            <div className="modal-content delete-content">
              <h3>¿Finalizar tarea?</h3>
              <div className="delete-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => setDoneModal({ open: false, item: null })}
                >
                  Cancelar
                </button>
                <button className="confirm-btn" onClick={confirmDone}>
                  Confirmar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}