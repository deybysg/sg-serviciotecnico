import React, { useEffect, useMemo, useState } from 'react';
import './UsuariosAdmin.css';
import { api } from '../services/api';
import Swal from 'sweetalert2';

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ username: '', password: '', role: 'user' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', role: 'user', password: '' });
  const [saving, setSaving] = useState(false);

  const toast = (icon, title) => Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer: 1800
  });

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      // Backend real (JWT) -> /api/usuarios (requiere admin/superadmin)
      const data = await api.get('/usuarios');
      setUsuarios(data);
    } catch (e) {
      setError('No se pudieron cargar los usuarios');
      toast('error', 'No se pudieron cargar los usuarios');
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
      toast('warning', 'Usuario y contraseña son obligatorios');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      toast('warning', 'La contraseña debe tener al menos 6 caracteres');
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
      setSaving(true);
      await api.post('/usuarios', payload);
      setForm({ username: '', password: '', role: 'user' });
      toast('success', 'Usuario creado');
      fetchUsuarios();
    } catch (e) {
      setError('No se pudo crear el usuario');
      toast('error', e?.message || 'No se pudo crear el usuario');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (u) => {
    setEditingId(u._id || u.id);
    setEditForm({ username: u.username, role: u.role, password: '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ username: '', role: 'user', password: '' });
  };

  const handleUpdate = async (id) => {
    setError(null);
    const user = usuarios.find(u => (u._id || u.id) === id);
    if (!user) return;
    if (protectedUsernames.has(user.username)) {
      setError('No se puede editar al superadmin');
      toast('info', 'El SuperAdmin no puede editarse');
      return;
    }

    if (editForm.password && editForm.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      toast('warning', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const payload = {
      username: editForm.username.trim(),
      role: editForm.role
    };
    // La contraseña es opcional en edición
    if (editForm.password) payload.password = editForm.password;

    try {
      setSaving(true);
      // Backend usa PUT /usuarios/:id
      await api.put(`/usuarios/${id}`, payload);
      cancelEdit();
      toast('success', 'Usuario actualizado');
      fetchUsuarios();
    } catch (e) {
      setError('No se pudo actualizar el usuario');
      toast('error',  'No se pudo actualizar usuario existente');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setError(null);
    const user = usuarios.find(u => (u._id || u.id) === id);
    if (!user) return;

    if (protectedUsernames.has(user.username)) {
      setError('No se puede eliminar al superadmin');
      return;
    }

    const ask = await Swal.fire({
      title: `¿Eliminar usuario "${user.username}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!ask.isConfirmed) return;

    try {
      setSaving(true);
      await api.delete(`/usuarios/${id}`);
      toast('success', 'Usuario eliminado');
      fetchUsuarios();
    } catch (e) {
      setError('No se pudo eliminar el usuario');
      toast('error', e?.message || 'No se pudo eliminar');
    } finally {
      setSaving(false);
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
          <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Crear'}</button>
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
                <tr key={u._id || u.id}>
                  <td>
                    {editingId === (u._id || u.id) ? (
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
                    {editingId === (u._id || u.id) ? (
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
                    {editingId === (u._id || u.id) ? (
                      <>
                        <button className="btn" onClick={() => handleUpdate(u._id || u.id)} disabled={protectedUsernames.has(u.username)}>Guardar</button>
                        <button className="btn secondary" onClick={cancelEdit}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="btn" onClick={() => startEdit(u)} disabled={protectedUsernames.has(u.username)}>Editar</button>
                        <button className="btn danger" onClick={() => handleDelete(u._id || u.id)} disabled={protectedUsernames.has(u.username)}>Eliminar</button>
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
