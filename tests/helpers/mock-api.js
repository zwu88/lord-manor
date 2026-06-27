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
        id: "task-today-2",
        taskDate: TODAY,
        title: "File the completed order",
        description: "A completed order for Chronicle statistics.",
        projectId: project.id,
        projectName: project.name,
        completed: true,
        completedAt: `${TODAY}T07:15:00.000Z`,
        createdAt: `${TODAY}T07:00:00.000Z`,
        updatedAt: `${TODAY}T07:15:00.000Z`
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
        id: "milestone-overdue-1",
        projectId: project.id,
        projectName: project.name,
        projectStatus: project.status,
        title: "Overdue smoke milestone",
        targetDate: addDays(TODAY, -1),
        notes: "Overdue and incomplete for Council Watch coverage.",
        completed: false,
        completedAt: null,
        createdAt: `${TODAY}T06:40:00.000Z`,
        updatedAt: `${TODAY}T06:40:00.000Z`
      },
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
      },
      {
        id: "milestone-outside-window-1",
        projectId: project.id,
        projectName: project.name,
        projectStatus: project.status,
        title: "Outside Chronicle window",
        targetDate: addDays(TODAY, 10),
        notes: "This milestone is outside the seven-day Chronicle window.",
        completed: false,
        completedAt: null,
        createdAt: `${TODAY}T06:50:00.000Z`,
        updatedAt: `${TODAY}T06:50:00.000Z`
      },
      {
        id: "milestone-completed-1",
        projectId: project.id,
        projectName: project.name,
        projectStatus: project.status,
        title: "Completed Chronicle milestone",
        targetDate: addDays(TODAY, 2),
        notes: "This completed milestone is excluded from Council Watch.",
        completed: true,
        completedAt: `${TODAY}T08:30:00.000Z`,
        createdAt: `${TODAY}T06:55:00.000Z`,
        updatedAt: `${TODAY}T08:30:00.000Z`
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

function isValidDateString(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(
    `${value}T00:00:00.000Z`
  );

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) ===
      value
  );
}

function emptyChronicleResponse(date) {
  return {
    date,
    horizonDate: addDays(date, 7),
    orders: [],
    issues: [],
    milestones: [],
    statistics: {
      orders: {
        total: 0,
        pending: 0,
        completed: 0
      },
      issues: {
        total: 0,
        durationMinutes: 0,
        moneyCostCents: 0
      },
      milestones: {
        total: 0,
        overdue: 0,
        dueToday: 0,
        dueSoon: 0
      }
    }
  };
}

function buildChronicleResponse(data, date) {
  const horizonDate = addDays(date, 7);

  const orders = clone(
    data.tasks
      .filter(task => task.taskDate === date)
      .sort((first, second) => {
        const completionDifference =
          Number(first.completed) -
          Number(second.completed);

        if (completionDifference !== 0) {
          return completionDifference;
        }

        const createdDifference =
          String(first.createdAt || "")
            .localeCompare(
              String(second.createdAt || "")
            );

        if (createdDifference !== 0) {
          return createdDifference;
        }

        return first.id.localeCompare(second.id);
      })
  );

  const issues = clone(
    data.issues
      .filter(issue => issue.date === date)
      .sort((first, second) => {
        const createdDifference =
          String(second.createdAt || "")
            .localeCompare(
              String(first.createdAt || "")
            );

        if (createdDifference !== 0) {
          return createdDifference;
        }

        return first.id.localeCompare(second.id);
      })
      .slice(0, 5)
  );

  const milestones = clone(
    data.milestones
      .filter(
        milestone =>
          !milestone.completed &&
          milestone.targetDate <= horizonDate
      )
      .sort((first, second) => {
        const targetDifference =
          first.targetDate.localeCompare(
            second.targetDate
          );

        if (targetDifference !== 0) {
          return targetDifference;
        }

        const createdDifference =
          String(first.createdAt || "")
            .localeCompare(
              String(second.createdAt || "")
            );

        if (createdDifference !== 0) {
          return createdDifference;
        }

        return first.id.localeCompare(second.id);
      })
      .slice(0, 5)
  );

  const pending =
    orders.filter(order => !order.completed)
      .length;

  return {
    date,
    horizonDate,
    orders,
    issues,
    milestones,
    statistics: {
      orders: {
        total: orders.length,
        pending,
        completed: orders.length - pending
      },
      issues: {
        total: issues.length,
        durationMinutes:
          issues.reduce(
            (sum, issue) =>
              sum +
              (Number(issue.duration) || 0),
            0
          ),
        moneyCostCents:
          issues.reduce(
            (sum, issue) =>
              sum +
              (Number(issue.moneyCostCents) || 0),
            0
          )
      },
      milestones: {
        total: milestones.length,
        overdue:
          milestones.filter(
            milestone =>
              milestone.targetDate < date
          ).length,
        dueToday:
          milestones.filter(
            milestone =>
              milestone.targetDate === date
          ).length,
        dueSoon:
          milestones.filter(
            milestone =>
              milestone.targetDate > date
          ).length
      }
    }
  };
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

  if (path === "/api/chronicle") {
    if (state.chronicleStatus) {
      return json(
        route,
        {
          error:
            state.chronicleError ||
            "Could not open the Manor Chronicle."
        },
        state.chronicleStatus
      );
    }

    const date = url.searchParams.get("date");

    if (!isValidDateString(date)) {
      return json(
        route,
        {
          error:
            "A valid Chronicle date in YYYY-MM-DD format is required."
        },
        400
      );
    }

    const response =
      state.chronicleResponse ||
      buildChronicleResponse(data, date);

    return json(route, clone(response));
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
    authenticated: options.authenticated === true,
    chronicleStatus:
      options.chronicleStatus || null,
    chronicleError:
      options.chronicleError || null,
    chronicleResponse:
      options.chronicleResponse || null
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
  emptyChronicleResponse,
  installMockApi
};
