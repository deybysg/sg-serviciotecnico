import React, { useEffect, useMemo, useState } from 'react';
import './UsuariosAdmin.css';
import { api } from '../services/api';
import Swal from 'sweetalert2';
import {
  FiUsers, FiUser, FiMail, FiLock, FiShield, FiPlus,
  FiSave, FiX, FiEdit3, FiTrash2, FiAlertTriangle,
  FiCheckCircle, FiHash, FiLoader
} from "react-icons/fi";

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ username: '', password: '', email: '', role: 'user' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', role: 'user', email: '', password: '' });
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
      const data = await api.get('/usuarios');
      setUsuarios(data);
    } catch (e) {
      setError('No se pudieron cargar los usuarios');
      toast('error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const refreshUsuarios = async () => {
    try {
      const data = await api.get('/usuarios');
      setUsuarios(data);
    } catch (e) {
      console.error('Error al refrescar usuarios:', e);
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

    // ===== VALIDACIONES FRONTEND =====
    
    // Validar username no vacío
    if (!form.username || !form.username.trim()) {
      setError('El nombre de usuario es obligatorio');
      toast('warning', 'El nombre de usuario es obligatorio');
      return;
    }

    // Validar longitud mínima del username
    if (form.username.trim().length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      toast('warning', 'El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    // Validar password no vacío
    if (!form.password) {
      setError('La contraseña es obligatoria');
      toast('warning', 'La contraseña es obligatoria');
      return;
    }

    // Validar longitud mínima de password
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      toast('warning', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar formato de email (si se proporciona)
    if (form.email && form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError('El email ingresado no es válido');
        toast('warning', 'El email ingresado no es válido');
        return;
      }
    }

    // Validar que el username no exista (verificación adicional frontend)
    const exists = usuarios.some(u => u.username.toLowerCase() === form.username.trim().toLowerCase());
    if (exists) {
      setError('El username ya existe');
      toast('warning', 'El username ya existe');
      return;
    }

    const payload = {
      username: form.username.trim(),
      password: form.password,
      email: form.email.trim() || undefined,
      role: form.role
    };

    try {
      setSaving(true);
      await api.post('/usuarios', payload);
      setForm({ username: '', password: '', email: '', role: 'user' });
      toast('success', 'Usuario creado');
      refreshUsuarios();
    } catch (e) {
      setError('No se pudo crear el usuario');
      toast('error', e?.message || 'No se pudo crear el usuario');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (u) => {
    setEditingId(u._id || u.id);
    setEditForm({ username: u.username, role: u.role, email: u.email || '', password: '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ username: '', role: 'user', email: '', password: '' });
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

    // ===== VALIDACIONES FRONTEND =====
    
    // Validar username no vacío
    if (!editForm.username || !editForm.username.trim()) {
      setError('El nombre de usuario es obligatorio');
      toast('warning', 'El nombre de usuario es obligatorio');
      return;
    }

    // Validar longitud mínima del username
    if (editForm.username.trim().length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      toast('warning', 'El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    // Validar password (si se proporciona)
    if (editForm.password && editForm.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      toast('warning', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar formato de email (si se proporciona)
    if (editForm.email && editForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email)) {
        setError('El email ingresado no es válido');
        toast('warning', 'El email ingresado no es válido');
        return;
      }
    }

    const payload = {
      username: editForm.username.trim(),
      role: editForm.role,
      email: editForm.email.trim() || undefined
    };
    // La contraseña es opcional en edición
    if (editForm.password) payload.password = editForm.password;

    try {
      setSaving(true);
      await api.put(`/usuarios/${id}`, payload);
      cancelEdit();
      toast('success', 'Usuario actualizado');
      refreshUsuarios();
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
      refreshUsuarios();
    } catch (e) {
      setError('No se pudo eliminar el usuario');
      toast('error', e?.message || 'No se pudo eliminar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="usuarios-admin-page">
      <div className="usuarios-shell">
        <header className="usuarios-admin-header">
          <h2><FiUsers size={28} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Usuarios</h2>
          <span className="badge-super"><FiShield size={12} /> SuperAdmin</span>
        </header>

        <section className="usuarios-card">
          <h3><FiUser size={16} /> Crear usuario</h3>
          <form onSubmit={handleCreate} className="create-form">
            <div className="create-form-field">
              <label><FiUser size={12} /> Username</label>
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="create-form-field">
              <label><FiMail size={12} /> Email</label>
              <input
                type="email"
                placeholder="Email (opcional)"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="create-form-field">
              <label><FiLock size={12} /> Contraseña</label>
              <input
                type="password"
                placeholder="Contraseña"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="create-form-field">
              <label><FiShield size={12} /> Rol</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={saving}>
              {saving ? <><FiLoader size={14} /> Guardando...</> : <><FiPlus size={14} /> Crear</>}
            </button>
          </form>
        </section>

        {error && (
          <div className="usuarios-error">
            <FiAlertTriangle size={16} /> {error}
          </div>
        )}

        <section className="usuarios-card">
          <h3><FiUsers size={16} /> Listado</h3>
          {loading ? (
            <div className="usuarios-loading"><FiLoader size={20} /> Cargando usuarios...</div>
          ) : (
            <div className="usuarios-table-container">
              <table className="usuarios-table">
                <thead>
                  <tr>
                    <th><FiUser size={12} /> Username</th>
                    <th><FiMail size={12} /> Email</th>
                    <th><FiShield size={12} /> Rol</th>
                    <th><FiEdit3 size={12} /> Acciones</th>
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
                          <strong style={{ color: '#fff', fontWeight: 700 }}>{u.username}</strong>
                        )}
                      </td>
                      <td>
                        {editingId === (u._id || u.id) ? (
                          <input
                            type="email"
                            placeholder="Email (opcional)"
                            value={editForm.email}
                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                          />
                        ) : (
                          u.email || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>Sin email</span>
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
                          <span className={`role-pill role-${u.role}`}>
                            {u.role === 'superadmin' && <FiShield size={10} />}
                            {u.role === 'admin' && <FiCheckCircle size={10} />}
                            {u.role === 'user' && <FiUser size={10} />}
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="acciones">
                        {editingId === (u._id || u.id) ? (
                          <>
                            <button className="btn save" onClick={() => handleUpdate(u._id || u.id)} disabled={protectedUsernames.has(u.username)}>
                              <FiSave size={12} /> Guardar
                            </button>
                            <button className="btn secondary" onClick={cancelEdit}>
                              <FiX size={12} /> Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="btn" onClick={() => startEdit(u)} disabled={protectedUsernames.has(u.username)}>
                              <FiEdit3 size={12} /> Editar
                            </button>
                            <button className="btn danger" onClick={() => handleDelete(u._id || u.id)} disabled={protectedUsernames.has(u.username)}>
                              <FiTrash2 size={12} /> Eliminar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="hint">
          <FiAlertTriangle size={12} /> Nota: El SuperAdmin no puede editarse ni eliminarse.
        </p>
      </div>
    </div>
  );
}
