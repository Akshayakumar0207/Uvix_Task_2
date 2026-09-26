"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const TASK_CATEGORIES = ["Development", "Testing", "Meeting", "Documentation", "Support", "Learning", "Other"];
const BLOCKER_SEVERITIES = ["None", "Low", "Medium", "High", "Critical"];

const EMPTY_FORM = {
  date: "",
  employeeName: "",
  role: "",
  email: "",
  todayGoal: "",
  taskDescription: "",
  taskCategory: "Development",
  tasksCompleted: "",
  taskOutcome: "",
  evidenceLink: "",
  plannedHours: "",
  actualHours: "",
  qualityRating: "",
  selfAssessedProgress: "",
  challenges: "",
  blockerSeverity: "None",
  tomorrowTasks: "",
  tomorrowGoal: "",
  selfRating: "",
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
      role: record.role || "",
      email: record.email || "",
      todayGoal: record.todayGoal || "",
      taskDescription: record.taskDescription || "",
      taskCategory: record.taskCategory || "Development",
      tasksCompleted: record.tasksCompleted,
      taskOutcome: record.taskOutcome || "",
      evidenceLink: record.evidenceLink || "",
      plannedHours: record.plannedHours,
      actualHours: record.actualHours,
      qualityRating: record.qualityRating,
      selfAssessedProgress: record.selfAssessedProgress,
      challenges: record.challenges || "",
      blockerSeverity: record.blockerSeverity || "None",
      tomorrowTasks: record.tomorrowTasks || "",
      tomorrowGoal: record.tomorrowGoal || "",
      selfRating: record.selfRating,
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
              <input type="date" className="input" value={form.date} onChange={(e) => updateField("date", e.target.value)} required />
            </label>
            <label>
              Employee name
              <input type="text" className="input" value={form.employeeName} onChange={(e) => updateField("employeeName", e.target.value)} required />
            </label>
            <label>
              Role
              <input type="text" className="input" value={form.role} onChange={(e) => updateField("role", e.target.value)} />
            </label>
            <label>
              Email
              <input type="email" className="input" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
            </label>

            <label className="span-2">
              Today's Goal
              <input type="text" className="input" value={form.todayGoal} onChange={(e) => updateField("todayGoal", e.target.value)} />
            </label>
            <label className="span-2">
              Task Description (up to 5, one per line)
              <textarea className="input" rows={3} value={form.taskDescription} onChange={(e) => updateField("taskDescription", e.target.value)} />
            </label>

            <label>
              Task Category
              <select className="input" value={form.taskCategory} onChange={(e) => updateField("taskCategory", e.target.value)}>
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Tasks Completed (0-5)
              <input type="number" min="0" max="5" className="input" value={form.tasksCompleted} onChange={(e) => updateField("tasksCompleted", e.target.value)} required />
            </label>

            <label className="span-2">
              Task Outcome / Result
              <input type="text" className="input" value={form.taskOutcome} onChange={(e) => updateField("taskOutcome", e.target.value)} />
            </label>
            <label className="span-2">
              Evidence Link
              <input type="url" className="input" placeholder="PR / ticket / doc / deployment link" value={form.evidenceLink} onChange={(e) => updateField("evidenceLink", e.target.value)} />
            </label>

            <label>
              Planned Hrs (0-24)
              <input type="number" min="0" max="24" step="0.5" className="input" value={form.plannedHours} onChange={(e) => updateField("plannedHours", e.target.value)} required />
            </label>
            <label>
              Actual Hrs (0-24)
              <input type="number" min="0" max="24" step="0.5" className="input" value={form.actualHours} onChange={(e) => updateField("actualHours", e.target.value)} required />
            </label>

            <label>
              Quality Rating (1-5)
              <input type="number" min="1" max="5" className="input" value={form.qualityRating} onChange={(e) => updateField("qualityRating", e.target.value)} required />
            </label>
            <label>
              Self-Assessed Progress % (0-100)
              <input type="number" min="0" max="100" className="input" value={form.selfAssessedProgress} onChange={(e) => updateField("selfAssessedProgress", e.target.value)} required />
            </label>

            <label className="span-2">
              Challenges / Blockers
              <input type="text" className="input" value={form.challenges} onChange={(e) => updateField("challenges", e.target.value)} />
            </label>
            <label>
              Blocker Severity
              <select className="input" value={form.blockerSeverity} onChange={(e) => updateField("blockerSeverity", e.target.value)}>
                {BLOCKER_SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Employee Self-Rating (1-5)
              <input type="number" min="1" max="5" className="input" value={form.selfRating} onChange={(e) => updateField("selfRating", e.target.value)} required />
            </label>

            <label className="span-2">
              Tomorrow's Tasks (up to 5, one per line)
              <textarea className="input" rows={2} value={form.tomorrowTasks} onChange={(e) => updateField("tomorrowTasks", e.target.value)} />
            </label>
            <label className="span-2">
              Tomorrow's Goal
              <input type="text" className="input" value={form.tomorrowGoal} onChange={(e) => updateField("tomorrowGoal", e.target.value)} />
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
                    <th>Category</th>
                    <th>Tasks</th>
                    <th>Hrs (P/A)</th>
                    <th>Quality</th>
                    <th>Progress %</th>
                    <th>Blocker</th>
                    <th>Self-Rating</th>
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
                        <td>{r.taskCategory}</td>
                        <td>{r.tasksCompleted}</td>
                        <td>{r.plannedHours}/{r.actualHours}</td>
                        <td>{r.qualityRating}</td>
                        <td>{r.selfAssessedProgress}%</td>
                        <td>{r.blockerSeverity}</td>
                        <td>{r.selfRating}</td>
                        <td>{r.performanceScore}</td>
                        <td className="actions-cell">
                          <button className="btn-link" onClick={() => startEdit(r)}>Edit</button>
                          <button className="btn-link btn-link-danger" onClick={() => handleDelete(r.id)}>Delete</button>
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
