'use client';

import { useState, useSyncExternalStore } from 'react';
import { adminRequest } from '@/lib/admin';

const subscribe = () => () => {};

export function PasswordForm() {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(''); setSuccess('');
    if (newPassword.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setError('La confirmación no coincide con la nueva contraseña.'); return; }
    setPending(true);
    try {
      const res = await adminRequest<{ message: string }>('auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccess(res.message || 'Contraseña actualizada correctamente.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.');
    } finally {
      setPending(false);
    }
  }

  return <form className="admin-form" onSubmit={submit}>
    <fieldset disabled={!ready || pending} className="form-section">
      <legend>Cambiar contraseña</legend>
      <p className="section-help">Al cambiar tu contraseña, se cerrarán automáticamente otras sesiones abiertas con esta cuenta.</p>
      <div className="form-grid">
        <label className="span-two">Contraseña actual<input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required autoComplete="current-password" /></label>
        <label>Nueva contraseña<input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" /></label>
        <label>Confirmar nueva contraseña<input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" /></label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {success && <p className="form-success" role="status">{success}</p>}
      <div className="form-footer"><button className="button" type="submit">{pending ? 'Actualizando…' : 'Actualizar contraseña'}</button></div>
    </fieldset>
  </form>;
}
