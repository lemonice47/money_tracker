import { useState } from "react";
import { authApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { CURRENCIES, ErrorBox, PageHeader } from "../components/ui";

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({ name: user.name, email: user.email, currency: user.currency, currentPassword: "", newPassword: "" });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaved("");
    try {
      const { user: updated } = await authApi.updateMe(form);
      setUser(updated);
      setForm({ ...form, currentPassword: "", newPassword: "" });
      setSaved("Saved");
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteAccount = async () => {
    try {
      await authApi.deleteMe();
      logout();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <PageHeader title="Profile" />
      <form className="card form" onSubmit={save}>
        <ErrorBox error={error} />
        <label>Name<input required value={form.name} onChange={set("name")} /></label>
        <label>Email<input type="email" required value={form.email} onChange={set("email")} /></label>
        <label>
          Currency
          <select value={form.currency} onChange={set("currency")}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <h2>Change password</h2>
        <label>Current password<input type="password" value={form.currentPassword} onChange={set("currentPassword")} /></label>
        <label>New password<input type="password" minLength={6} value={form.newPassword} onChange={set("newPassword")} /></label>
        <div className="row">
          <button className="btn primary">Save changes</button>
          {saved && <span className="muted small">{saved}</span>}
        </div>
      </form>

      <section className="card danger-zone">
        <h2>Delete account</h2>
        <p className="muted small">This removes your account and every entry. It can't be undone.</p>
        {confirmDelete ? (
          <div className="row">
            <button className="btn danger" onClick={deleteAccount}>Yes, delete everything</button>
            <button className="btn ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn ghost" onClick={() => setConfirmDelete(true)}>Delete my account</button>
        )}
      </section>
    </div>
  );
}