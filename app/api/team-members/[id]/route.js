import { updateRecord, deleteRecord } from "../../../../lib/store";

function isAuthorized(request) {
  const required = process.env.TEAM_LEAD_PASSWORD;
  if (!required) return true;
  return request.headers.get("x-team-lead-password") === required;
}

function toRecordFields(body) {
  return {
    date: body.date,
    employeeName: body.employeeName,
    role: body.role || "",
    email: body.email || "",
    todayGoal: body.todayGoal || "",
    taskDescription: body.taskDescription || "",
    taskCategory: body.taskCategory || "Other",
    tasksCompleted: Number(body.tasksCompleted),
    taskOutcome: body.taskOutcome || "",
    evidenceLink: body.evidenceLink || "",
    plannedHours: Number(body.plannedHours),
    actualHours: Number(body.actualHours),
    qualityRating: Number(body.qualityRating),
    selfAssessedProgress: Number(body.selfAssessedProgress),
    challenges: body.challenges || "",
    blockerSeverity: body.blockerSeverity || "None",
    tomorrowTasks: body.tomorrowTasks || "",
    tomorrowGoal: body.tomorrowGoal || "",
    selfRating: Number(body.selfRating),
  };
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
    const updated = updateRecord(params.id, toRecordFields(body));
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
