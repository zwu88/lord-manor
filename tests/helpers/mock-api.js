const TODAY = new Date().toISOString().slice(0, 10);
const CHRONICLE_FORMAT_VERSION = 2;

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeBoolean(value) {
  return value === true || value === 1 || value === "1";
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
        description: "A completed order excluded from new Chronicle payloads.",
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
      },
      {
        id: "task-tomorrow-2",
        taskDate: addDays(TODAY, 1),
        title: "Draft the council docket",
        description: "A second active order for tomorrow.",
        projectId: null,
        projectName: null,
        completed: 0,
        completedAt: null,
        createdAt: `${TODAY}T06:35:00.000Z`,
        updatedAt: `${TODAY}T06:35:00.000Z`
      },
      {
        id: "task-tomorrow-completed-early",
        taskDate: addDays(TODAY, 1),
        title: "Completed early tomorrow order",
        description: "This order was resolved before its scheduled date.",
        projectId: project.id,
        projectName: project.name,
        completed: 1,
        completedAt: `${TODAY}T07:45:00.000Z`,
        createdAt: `${TODAY}T06:38:00.000Z`,
        updatedAt: `${TODAY}T07:45:00.000Z`
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
    presentation: {
      headline: "A Quiet Morning Across the Manor",
      lead:
        "Today's dispatch contains 0 orders, 0 recorded affairs, and 0 milestones overdue or due within the next seven days."
    },
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
      .filter(
        task =>
          task.taskDate === date &&
          !normalizeBoolean(task.completed)
      )
      .sort((first, second) => {
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

  const statistics = {
    orders: {
      total: orders.length,
      pending: orders.length,
      completed: 0
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
  };

  const presentation =
    buildPresentation(statistics);

  return {
    date,
    horizonDate,
    presentation,
    orders,
    issues,
    milestones,
    statistics,
    formatVersion: CHRONICLE_FORMAT_VERSION
  };
}

function buildPresentation(statistics) {
  let headline;

  if (statistics.orders.total > 0) {
    headline =
      `${statistics.orders.total} ${
        statistics.orders.total === 1
          ? "Order Awaits"
          : "Orders Await"
      } Attention`;
  } else if (statistics.issues.total > 0) {
    headline =
      `${statistics.issues.total} ${
        statistics.issues.total === 1
          ? "Affair Enters"
          : "Affairs Enter"
      } Today's Record`;
  } else if (statistics.milestones.total > 0) {
    headline =
      "Council Deadlines Approach";
  } else {
    headline =
      "A Quiet Morning Across the Manor";
  }

  return {
    headline,
    lead:
      `Today's dispatch contains ${
        statistics.orders.total
      } ${
        statistics.orders.total === 1
          ? "order"
          : "orders"
      }, ${statistics.issues.total} ${
        statistics.issues.total === 1
          ? "recorded affair"
          : "recorded affairs"
      }, and ${statistics.milestones.total} ${
        statistics.milestones.total === 1
          ? "milestone"
          : "milestones"
      } overdue or due within the next seven days.`
  };
}

function createEditionFromChronicle(
  chronicle,
  sealedAt,
  formatVersion = CHRONICLE_FORMAT_VERSION
) {
  return {
    ...clone(chronicle),
    formatVersion,
    sealedAt,
    updatedAt: sealedAt
  };
}

function editionMetadata(edition) {
  return {
    date: edition.date,
    horizonDate: edition.horizonDate,
    headline: edition.presentation.headline,
    formatVersion: edition.formatVersion,
    sealedAt: edition.sealedAt,
    updatedAt: edition.updatedAt
  };
}

function createInitialEditions(data, options) {
  const editions = new Map();

  if (options.emptyEditions) {
    return editions;
  }

  const todayEdition =
    createEditionFromChronicle(
      buildChronicleResponse(data, TODAY),
      `${TODAY}T10:00:00.000Z`
    );

  todayEdition.presentation.headline =
    "Sealed Fixture Edition";
  todayEdition.presentation.lead =
    "This sealed fixture edition is stored as a permanent snapshot.";

  const previousDate = addDays(TODAY, -1);
  const previousEdition =
    createEditionFromChronicle(
      {
        ...emptyChronicleResponse(previousDate),
        presentation: {
          headline:
            "Previous Sealed Edition",
          lead:
            "This previous edition proves historical archive loading."
        },
        orders: [
          {
            id: "archived-order-1",
            taskDate: previousDate,
            title: "Archived pending order",
            description:
              "Stored previous-day order.",
            projectId: null,
            projectName: null,
            completed: false,
            completedAt: null,
            createdAt:
              `${previousDate}T06:00:00.000Z`,
            updatedAt:
              `${previousDate}T06:00:00.000Z`
          },
          {
            id: "archived-completed-order-1",
            taskDate: previousDate,
            title: "Archived completed order",
            description:
              "Legacy completed order metadata.",
            projectId: null,
            projectName: null,
            completed: true,
            completedAt:
              `${previousDate}T07:00:00.000Z`,
            createdAt:
              `${previousDate}T06:30:00.000Z`,
            updatedAt:
              `${previousDate}T07:00:00.000Z`
          }
        ]
      },
      `${previousDate}T10:00:00.000Z`,
      1
    );

  if (!options.noTodayEdition) {
    editions.set(TODAY, todayEdition);
  }

  editions.set(previousDate, previousEdition);

  return editions;
}

async function handleChronicleEditions(
  route,
  request,
  data,
  state
) {
  const url = new URL(request.url());
  const method = request.method();

  if (state.editionStatus) {
    return json(
      route,
      {
        error:
          state.editionError ||
          "Could not load Chronicle editions."
      },
      state.editionStatus
    );
  }

  if (state.editionStorageUnavailable) {
    return json(
      route,
      {
        error:
          "Chronicle edition storage is not available.",
        code:
          "CHRONICLE_EDITION_STORAGE_UNAVAILABLE"
      },
      503
    );
  }

  if (method === "GET") {
    const date = url.searchParams.get("date");

    if (date !== null) {
      if (!isValidDateString(date)) {
        return json(
          route,
          {
            error:
              "A valid Chronicle edition date in YYYY-MM-DD format is required."
          },
          400
        );
      }

      const edition =
        state.editions.get(date);

      if (!edition) {
        return json(
          route,
          {
            error:
              "The Chronicle edition was not found."
          },
          404
        );
      }

      return json(route, {
        edition: clone(edition)
      });
    }

    const editions =
      [...state.editions.values()]
        .sort((first, second) => {
          const dateDifference =
            second.date.localeCompare(
              first.date
            );

          if (dateDifference !== 0) {
            return dateDifference;
          }

          return second.updatedAt.localeCompare(
            first.updatedAt
          );
        })
        .slice(0, 100)
        .map(editionMetadata);

    return json(route, {
      editions,
      count: editions.length
    });
  }

  if (!sameOrigin(request)) {
    return json(
      route,
      { error: "Invalid request origin." },
      403
    );
  }

  const input = await readJson(request);
  const date =
    typeof input.date === "string"
      ? input.date.trim()
      : "";

  if (!isValidDateString(date)) {
    return json(
      route,
      {
        error:
          "A valid Chronicle edition date in YYYY-MM-DD format is required."
      },
      400
    );
  }

  if (method === "POST") {
    if (state.sealConflict) {
      return json(
        route,
        {
          error:
            "A Chronicle edition has already been sealed for this date."
        },
        409
      );
    }

    if (state.editions.has(date)) {
      return json(
        route,
        {
          error:
            "A Chronicle edition has already been sealed for this date."
        },
        409
      );
    }

    const sealedAt =
      new Date().toISOString();

    const edition =
      createEditionFromChronicle(
        buildChronicleResponse(data, date),
        sealedAt
      );

    state.editions.set(date, edition);

    return json(
      route,
      {
        edition: clone(edition)
      },
      201
    );
  }

  if (method === "PUT") {
    const existing =
      state.editions.get(date);

    if (!existing) {
      return json(
        route,
        {
          error:
            "The Chronicle edition was not found."
        },
        404
      );
    }

    const regenerated =
      createEditionFromChronicle(
        buildChronicleResponse(data, date),
        existing.sealedAt
      );

    regenerated.updatedAt =
      new Date(
        Date.parse(existing.updatedAt) + 60_000
      ).toISOString();

    state.editions.set(date, regenerated);

    return json(route, {
      edition: clone(regenerated)
    });
  }

  return json(
    route,
    { error: "Method not allowed." },
    405
  );
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

  if (key === "tasks" && method === "PUT" && !existing) {
    return json(route, { error: "The task was not found." }, 404);
  }

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
    if (method === "POST") {
      record.completed = false;
      record.completedAt = null;
    } else {
      const requestedCompleted =
        Object.hasOwn(input, "completed")
          ? normalizeBoolean(input.completed)
          : normalizeBoolean(existing.completed);

      record.completed = requestedCompleted;
      record.completedAt =
        requestedCompleted
          ? normalizeBoolean(existing.completed)
            ? existing.completedAt || now
            : now
          : null;
    }
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

  if (path === "/api/chronicle-editions") {
    return handleChronicleEditions(
      route,
      request,
      data,
      state
    );
  }

  if (path === "/api/issues") {
    return handleCollection(route, request, data, "issues", "issue");
  }

  if (path === "/api/projects") {
    return handleCollection(route, request, data, "projects", "project");
  }

  if (path === "/api/tasks") {
    if (
      request.method() === "PUT" &&
      state.taskPutStatus
    ) {
      return json(
        route,
        {
          error:
            state.taskPutError ||
            "Could not update tomorrow's order."
        },
        state.taskPutStatus
      );
    }

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
      options.chronicleResponse || null,
    editionStatus:
      options.editionStatus || null,
    editionError:
      options.editionError || null,
    editionStorageUnavailable:
      options.editionStorageUnavailable === true,
    sealConflict:
      options.sealConflict === true,
    taskPutStatus:
      options.taskPutStatus || null,
    taskPutError:
      options.taskPutError || null,
    editions: null
  };

  state.editions =
    createInitialEditions(data, options);

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
