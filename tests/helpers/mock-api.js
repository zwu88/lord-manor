const TODAY = new Date().toISOString().slice(0, 10);

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createInitialData() {
  const project = {
    id: "project-council-1",
    name: "Codex Runtime Foundation",
    region: "research-institute",
    objective: "Establish dependable automated development checks.",
    status: "active",
    startDate: TODAY,
    targetDate: addDays(TODAY, 14),
    progress: 35,
    nextAction: "Review the smoke-test foundation.",
    notes: "Keep the production architecture unchanged.",
    completedAt: null,
    createdAt: `${TODAY}T08:00:00.000Z`,
    updatedAt: `${TODAY}T08:00:00.000Z`
  };

  return {
    projects: [project],
    issues: [
      {
        id: "issue-today-1",
        date: TODAY,
        region: "research-institute",
        projectId: project.id,
        projectName: project.name,
        title: "Smoke test fixture issue",
        description: "A deterministic issue dated today.",
        duration: 45,
        moneyCostCents: 1250,
        createdAt: `${TODAY}T09:00:00.000Z`,
        updatedAt: `${TODAY}T09:00:00.000Z`
      },
      {
        id: "issue-money-duration-1",
        date: addDays(TODAY, -2),
        region: "academy",
        projectId: null,
        projectName: null,
        title: "Course supply purchase",
        description: "An issue with both money and duration.",
        duration: 90,
        moneyCostCents: 3450,
        createdAt: `${TODAY}T07:00:00.000Z`,
        updatedAt: `${TODAY}T07:00:00.000Z`
      }
    ],
    tasks: [
      {
        id: "task-today-1",
        taskDate: TODAY,
        title: "Read the morning orders",
        description: "A deterministic order for the Chronicle.",
        projectId: project.id,
        projectName: project.name,
        completed: false,
        completedAt: null,
        createdAt: `${TODAY}T06:00:00.000Z`,
        updatedAt: `${TODAY}T06:00:00.000Z`
      },
      {
        id: "task-tomorrow-1",
        taskDate: addDays(TODAY, 1),
        title: "Prepare browser smoke review",
        description: "A deterministic order for the Estate Office.",
        projectId: project.id,
        projectName: project.name,
        completed: false,
        completedAt: null,
        createdAt: `${TODAY}T06:30:00.000Z`,
        updatedAt: `${TODAY}T06:30:00.000Z`
      }
    ],
    milestones: [
      {
        id: "milestone-week-1",
        projectId: project.id,
        projectName: project.name,
        projectStatus: project.status,
        title: "Smoke tests reviewed",
        targetDate: addDays(TODAY, 3),
        notes: "Due within seven days for Chronicle coverage.",
        completed: false,
        completedAt: null,
        createdAt: `${TODAY}T06:45:00.000Z`,
        updatedAt: `${TODAY}T06:45:00.000Z`
      }
    ]
  };
}

function json(route, payload, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    headers: {
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(payload)
  });
}

function withProjectNames(data) {
  const projectNames = new Map(
    data.projects.map(project => [project.id, project.name])
  );
  const projectStatuses = new Map(
    data.projects.map(project => [project.id, project.status])
  );

  data.issues = data.issues.map(issue => ({
    ...issue,
    projectName: issue.projectId ? projectNames.get(issue.projectId) : null
  }));

  data.tasks = data.tasks.map(task => ({
    ...task,
    projectName: task.projectId ? projectNames.get(task.projectId) : null
  }));

  data.milestones = data.milestones.map(milestone => ({
    ...milestone,
    projectName: projectNames.get(milestone.projectId) || null,
    projectStatus: projectStatuses.get(milestone.projectId) || null
  }));
}

async function readJson(request) {
  const body = request.postData();
  return body ? JSON.parse(body) : {};
}

function createRecordId(prefix, data) {
  const count = Object.values(data).reduce(
    (sum, collection) => sum + collection.length,
    0
  );

  return `${prefix}-${Date.now()}-${count}`;
}

function sameOrigin(request) {
  return request.headers().origin === "http://127.0.0.1:4173";
}

async function handleCollection(route, request, data, key, singular) {
  const method = request.method();
  const url = new URL(request.url());

  if (method === "GET") {
    const rows =
      key === "tasks"
        ? data.tasks.filter(task => task.taskDate === url.searchParams.get("date"))
        : data[key];

    return json(route, {
      [key]: clone(rows)
    });
  }

  if (!sameOrigin(request)) {
    return json(route, { error: "Invalid request origin." }, 403);
  }

  if (method === "DELETE") {
    const id = url.searchParams.get("id");
    data[key] = data[key].filter(item => item.id !== id);
    return json(route, { deleted: true, id });
  }

  const input = await readJson(request);
  const now = new Date().toISOString();
  const existing =
    method === "PUT"
      ? data[key].find(item => item.id === input.id)
      : null;

  const record = {
    ...existing,
    ...input,
    id: existing?.id || createRecordId(singular, data),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  if (key === "projects") {
    record.completedAt =
      record.status === "completed" ? record.completedAt || now : null;
  }

  if (key === "tasks") {
    record.completedAt = record.completed ? record.completedAt || now : null;
  }

  if (key === "milestones") {
    record.completedAt = record.completed ? record.completedAt || now : null;
  }

  if (method === "PUT") {
    data[key] = data[key].map(item => (item.id === record.id ? record : item));
  } else {
    data[key].push(record);
  }

  withProjectNames(data);

  return json(
    route,
    {
      [singular]: clone(record)
    },
    method === "POST" ? 201 : 200
  );
}

async function handleApi(route, data, state) {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname;

  if (path === "/api/auth/session") {
    return json(route, { authenticated: state.authenticated });
  }

  if (path === "/api/auth/login") {
    state.authenticated = true;
    return json(route, { authenticated: true });
  }

  if (path === "/api/auth/logout") {
    state.authenticated = false;
    return json(route, { authenticated: false });
  }

  if (!state.authenticated) {
    return json(route, { error: "Authentication required." }, 401);
  }

  if (path === "/api/issues") {
    return handleCollection(route, request, data, "issues", "issue");
  }

  if (path === "/api/projects") {
    return handleCollection(route, request, data, "projects", "project");
  }

  if (path === "/api/tasks") {
    return handleCollection(route, request, data, "tasks", "task");
  }

  if (path === "/api/milestones") {
    return handleCollection(route, request, data, "milestones", "milestone");
  }

  return json(route, { error: "Not found." }, 404);
}

async function installMockApi(page, options = {}) {
  const data = createInitialData();
  const state = {
    authenticated: options.authenticated === true
  };

  await page.route("**/api/**", route => handleApi(route, data, state));

  return {
    data,
    state,
    today: TODAY,
    tomorrow: addDays(TODAY, 1)
  };
}

module.exports = {
  installMockApi
};
