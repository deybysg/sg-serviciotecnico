import React, { useEffect, useMemo, useState } from 'react';
import './UsuariosAdmin.css';

const API = 'http://localhost:3001/Usuarios';

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ username: '', password: '', role: 'user' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', role: 'user', password: '' });

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await fetch(API);
      const data = await res.json();
      setUsuarios(data);
    } catch (e) {
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const protectedUsernames = useMemo(() => new Set(
    usuarios.filter(u => u.isProtected || u.role === 'superadmin').map(u => u.username)
  ), [usuarios]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.username.trim() || !form.password) {
      setError('Usuario y contraseña son obligatorios');
      return;
    }

    const exists = usuarios.some(u => u.username.toLowerCase() === form.username.trim().toLowerCase());
    if (exists) {
      setError('El username ya existe');
      return;
    }

    const payload = {
      username: form.username.trim(),
      password: form.password,
      role: form.role
    };

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Error creando usuario');
      setForm({ username: '', password: '', role: 'user' });
      fetchUsuarios();
    } catch (e) {
      setError('No se pudo crear el usuario');
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditForm({ username: u.username, role: u.role, password: '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ username: '', role: 'user', password: '' });
  };

  const handleUpdate = async (id) => {
    setError(null);
    const user = usuarios.find(u => u.id === id);
    if (!user) return;
    if (protectedUsernames.has(user.username)) {
      setError('No se puede editar al superadmin');
      return;
    }

    const payload = {
      username: editForm.username.trim(),
      role: editForm.role
    };
    // La contraseña es opcional en edición
    if (editForm.password) payload.password = editForm.password;

    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Error actualizando usuario');
      cancelEdit();
      fetchUsuarios();
    } catch (e) {
      setError('No se pudo actualizar el usuario');
    }
  };

  const handleDelete = async (id) => {
    setError(null);
    const user = usuarios.find(u => u.id === id);
    if (!user) return;

    if (protectedUsernames.has(user.username)) {
      setError('No se puede eliminar al superadmin');
      return;
    }

    const ok = window.confirm(`¿Eliminar usuario "${user.username}"?`);
    if (!ok) return;

    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando usuario');
      fetchUsuarios();
    } catch (e) {
      setError('No se pudo eliminar el usuario');
    }
  };

  return (
    <div className="usuarios-admin-page">
      <header className="usuarios-admin-header">
        <h2>Usuarios</h2>
        <span className="badge-super">SuperAdmin</span>
      </header>

      <section className="usuarios-form">
        <h3>Crear usuario</h3>
        <form onSubmit={handleCreate} className="create-form">
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <select
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit">Crear</button>
        </form>
      </section>

      {error && <div className="usuarios-error">{error}</div>}

      <section className="usuarios-list">
        <h3>Listado</h3>
        {loading ? (
          <div>Cargando...</div>
        ) : (
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td>
                    {editingId === u.id ? (
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                      />
                    ) : (
                      u.username
                    )}
                  </td>
                  <td>
                    {editingId === u.id ? (
                      <select
                        value={editForm.role}
                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        {u.role === 'superadmin' && <option value="superadmin">SuperAdmin</option>}
                      </select>
                    ) : (
                      <span className={`role-pill role-${u.role}`}>{u.role}</span>
                    )}
                  </td>
                  <td className="acciones">
                    {editingId === u.id ? (
                      <>
                        <button className="btn" onClick={() => handleUpdate(u.id)} disabled={protectedUsernames.has(u.username)}>Guardar</button>
                        <button className="btn secondary" onClick={cancelEdit}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="btn" onClick={() => startEdit(u)} disabled={protectedUsernames.has(u.username)}>Editar</button>
                        <button className="btn danger" onClick={() => handleDelete(u.id)} disabled={protectedUsernames.has(u.username)}>Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="hint">Nota: El SuperAdmin no puede editarse ni eliminarse.</p>
    </div>
  );
}
