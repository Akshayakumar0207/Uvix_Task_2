import { updateRecord, deleteRecord } from "../../../../lib/store";

function isAuthorized(request) {
  const required = process.env.TEAM_LEAD_PASSWORD;
  if (!required) return true;
  return request.headers.get("x-team-lead-password") === required;
}

export async function PUT(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Wrong Team Lead password." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const updated = updateRecord(params.id, {
      date: body.date,
      employeeName: body.employeeName,
      tasksAssigned: Number(body.tasksAssigned),
      tasksCompleted: Number(body.tasksCompleted),
      qualityScore: Number(body.qualityScore),
      hoursWorked: Number(body.hoursWorked),
      pendingTask: body.pendingTask || "",
    });
    if (!updated) return Response.json({ ok: false, error: "Record not found." }, { status: 404 });
    return Response.json({ ok: true, record: updated });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Wrong Team Lead password." }, { status: 401 });
  }

  try {
    const deleted = deleteRecord(params.id);
    if (!deleted) return Response.json({ ok: false, error: "Record not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
