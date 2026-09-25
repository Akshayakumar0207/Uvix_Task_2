import { readAll, addRecord } from "../../../lib/store";
import { withScores } from "../../../lib/aggregate";

const REQUIRED_FIELDS = ["date", "employeeName", "tasksAssigned", "tasksCompleted", "qualityScore", "hoursWorked"];

function isAuthorized(request) {
  const required = process.env.TEAM_LEAD_PASSWORD;
  if (!required) return true; // no password configured — open for local dev convenience
  return request.headers.get("x-team-lead-password") === required;
}

export async function GET() {
  try {
    const records = readAll();
    return Response.json({ ok: true, records: withScores(records) });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Wrong Team Lead password." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === "") {
      return Response.json({ ok: false, error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  try {
    const record = addRecord({
      date: body.date,
      employeeName: body.employeeName,
      tasksAssigned: Number(body.tasksAssigned),
      tasksCompleted: Number(body.tasksCompleted),
      qualityScore: Number(body.qualityScore),
      hoursWorked: Number(body.hoursWorked),
      pendingTask: body.pendingTask || "",
    });
    return Response.json({ ok: true, record });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
