import { readAll, addRecord } from "../../../lib/store";
import { withScores } from "../../../lib/aggregate";

const REQUIRED_FIELDS = [
  "date",
  "employeeName",
  "tasksCompleted",
  "plannedHours",
  "actualHours",
  "qualityRating",
  "selfAssessedProgress",
  "selfRating",
];

function isAuthorized(request) {
  const required = process.env.TEAM_LEAD_PASSWORD;
  if (!required) return true; // no password configured — open for local dev convenience
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
    const record = addRecord(toRecordFields(body));
    return Response.json({ ok: true, record });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
