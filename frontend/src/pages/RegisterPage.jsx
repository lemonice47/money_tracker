import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorBox } from "../components/ui";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <div className="brand big">Daily Money Book</div>
        <p className="muted">Create your account</p>
        <ErrorBox error={error} />
        <label>
          Name
          <input required value={form.name} onChange={set("name")} />
        </label>
        <label>
          Email
          <input type="email" required value={form.email} onChange={set("email")} />
        </label>
        <label>
          Password
          <input type="password" required minLength={6} value={form.password} onChange={set("password")} />
        </label>
        <button className="btn primary" disabled={busy}>{busy ? "Creating…" : "Sign up"}</button>
        <p className="muted small">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}