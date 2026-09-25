"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const EMPTY_FORM = {
  date: "",
  employeeName: "",
  tasksAssigned: "",
  tasksCompleted: "",
  qualityScore: "",
  hoursWorked: "",
  pendingTask: "",
};

export default function TeamLeadAdmin() {
  const [password, setPassword] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("teamLeadPassword");
    if (saved) setPassword(saved);
    fetchRecords();
  }, []);

  function fetchRecords() {
    setLoading(true);
    fetch("/api/team-members")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error);
        setRecords(json.records);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function updatePassword(value) {
    setPassword(value);
    sessionStorage.setItem("teamLeadPassword", value);
  }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(record) {
    setEditingId(record.id);
    setForm({
      date: record.date,
      employeeName: record.employeeName,
      tasksAssigned: record.tasksAssigned,
      tasksCompleted: record.tasksCompleted,
      qualityScore: record.qualityScore,
      hoursWorked: record.hoursWorked,
      pendingTask: record.pendingTask || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const url = editingId ? `/api/team-members/${editingId}` : "/api/team-members";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-team-lead-password": password,
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      cancelEdit();
      fetchRecords();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this record? This can't be undone.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/team-members/${id}`, {
        method: "DELETE",
        headers: { "x-team-lead-password": password },
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      fetchRecords();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div>
            <span className="brand">Uvix</span>
            <span className="brand-sub">Team Lead Admin</span>
          </div>
          <Link href="/" className="nav-link">
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <div className="container">
        <p className="subtitle">Add, edit, or delete any intern's daily report record.</p>

      <div className="card">
        <h2>Team Lead password</h2>
        <input
          type="password"
          className="input"
          placeholder="Leave blank if no password is set (local dev)"
          value={password}
          onChange={(e) => updatePassword(e.target.value)}
        />
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="card">
        <h2>{editingId ? "Edit record" : "Add a new record"}</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Date
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              required
            />
          </label>
          <label>
            Employee name
            <input
              type="text"
              className="input"
              value={form.employeeName}
              onChange={(e) => updateField("employeeName", e.target.value)}
              required
            />
          </label>
          <label>
            Tasks assigned
            <input
              type="number"
              min="0"
              className="input"
              value={form.tasksAssigned}
              onChange={(e) => updateField("tasksAssigned", e.target.value)}
              required
            />
          </label>
          <label>
            Tasks completed
            <input
              type="number"
              min="0"
              className="input"
              value={form.tasksCompleted}
              onChange={(e) => updateField("tasksCompleted", e.target.value)}
              required
            />
          </label>
          <label>
            Quality score (0-10)
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              className="input"
              value={form.qualityScore}
              onChange={(e) => updateField("qualityScore", e.target.value)}
              required
            />
          </label>
          <label>
            Hours worked
            <input
              type="number"
              min="0"
              max="24"
              step="0.1"
              className="input"
              value={form.hoursWorked}
              onChange={(e) => updateField("hoursWorked", e.target.value)}
              required
            />
          </label>
          <label className="span-2">
            Pending task (optional)
            <input
              type="text"
              className="input"
              placeholder="e.g. waiting on API access, code review pending"
              value={form.pendingTask}
              onChange={(e) => updateField("pendingTask", e.target.value)}
            />
          </label>

          <div className="form-actions span-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Add record"}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>All records ({records.length})</h2>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Tasks</th>
                  <th>Quality</th>
                  <th>Hours</th>
                  <th>Pending</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records
                  .slice()
                  .sort((a, b) => (a.date < b.date ? 1 : -1))
                  .map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.employeeName}</td>
                      <td>
                        {r.tasksCompleted}/{r.tasksAssigned}
                      </td>
                      <td>{r.qualityScore}</td>
                      <td>{r.hoursWorked}</td>
                      <td>{r.pendingTask || "—"}</td>
                      <td>{r.performanceScore}</td>
                      <td className="actions-cell">
                        <button className="btn-link" onClick={() => startEdit(r)}>
                          Edit
                        </button>
                        <button className="btn-link btn-link-danger" onClick={() => handleDelete(r.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
