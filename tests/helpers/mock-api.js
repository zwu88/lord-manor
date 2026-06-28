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
      },
      {
        id: "task-day-three-1",
        taskDate: addDays(TODAY, 3),
        title: "Prepare third-day order",
        description: "A future planner order.",
        projectId: project.id,
        projectName: project.name,
        completed: false,
        completedAt: null,
        createdAt: `${TODAY}T06:50:00.000Z`,
        updatedAt: `${TODAY}T06:50:00.000Z`
      },
      {
        id: "task-day-five-1",
        taskDate: addDays(TODAY, 5),
        title: "Review fifth-day supplies",
        description: "A future order without a project.",
        projectId: null,
        projectName: null,
        completed: false,
        completedAt: null,
        createdAt: `${TODAY}T06:55:00.000Z`,
        updatedAt: `${TODAY}T06:55:00.000Z`
      },
      {
        id: "task-future-completed-1",
        taskDate: addDays(TODAY, 4),
        title: "Completed future order",
        description: "Excluded from planner counts.",
        projectId: project.id,
        projectName: project.name,
        completed: true,
        completedAt: `${TODAY}T08:00:00.000Z`,
        createdAt: `${TODAY}T07:00:00.000Z`,
        updatedAt: `${TODAY}T08:00:00.000Z`
      },
      {
        id: "task-overdue-1",
        taskDate: addDays(TODAY, -3),
        title: "Overdue archive review",
        description: "An overdue active order.",
        projectId: project.id,
        projectName: project.name,
        completed: false,
        completedAt: null,
        createdAt: `${TODAY}T05:00:00.000Z`,
        updatedAt: `${TODAY}T05:00:00.000Z`
      },
      {
        id: "task-overdue-2",
        taskDate: addDays(TODAY, -1),
        title: "Overdue garden note",
        description: "An overdue active order without a project.",
        projectId: null,
        projectName: null,
        completed: false,
        completedAt: null,
        createdAt: `${TODAY}T05:30:00.000Z`,
        updatedAt: `${TODAY}T05:30:00.000Z`
      },
      {
        id: "task-overdue-completed-1",
        taskDate: addDays(TODAY, -2),
        title: "Completed historical order",
        description: "Excluded from overdue planner views.",
        projectId: project.id,
        projectName: project.name,
        completed: true,
        completedAt: `${TODAY}T08:15:00.000Z`,
        createdAt: `${TODAY}T05:45:00.000Z`,
        updatedAt: `${TODAY}T08:15:00.000Z`
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

function activeTasksForDate(data, date) {
  return clone(
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
}

function buildOrderPlannerResponse(
  data,
  selectedDate,
  today
) {
  const tomorrow = addDays(today, 1);
  const week = Array.from(
    { length: 7 },
    (_, index) => {
      const date = addDays(today, index);
      const activeCount =
        data.tasks.filter(
          task =>
            task.taskDate === date &&
            !normalizeBoolean(task.completed)
        ).length;

      return {
        date,
        activeCount
      };
    }
  );

  const overdueOrders = clone(
    data.tasks
      .filter(
        task =>
          task.taskDate < today &&
          task.taskDate !== selectedDate &&
          !normalizeBoolean(task.completed)
      )
      .sort((first, second) => {
        const dateDifference =
          first.taskDate.localeCompare(
            second.taskDate
          );

        if (dateDifference !== 0) {
          return dateDifference;
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
      .slice(0, 100)
  );

  return {
    selectedDate,
    today,
    tomorrow,
    weekStart: today,
    weekEnd: addDays(today, 6),
    selectedOrders:
      activeTasksForDate(data, selectedDate),
    overdueOrders,
    week
  };
}

function addUtcDays(dateString, days) {
  const date = new Date(
    `${dateString}T00:00:00.000Z`
  );
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekStartFor(dateString) {
  const date = new Date(
    `${dateString}T00:00:00.000Z`
  );
  const daysSinceMonday =
    (date.getUTCDay() + 6) % 7;
  date.setUTCDate(
    date.getUTCDate() - daysSinceMonday
  );
  return date.toISOString().slice(0, 10);
}

function normalizeReportNumber(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.trunc(number)
    : 0;
}

const WEEKLY_DEPARTMENTS = {
  "research-institute": {
    name: "The Research Institute",
    shortName: "Research Institute"
  },
  academy: {
    name: "The Academy",
    shortName: "Academy"
  },
  "health-commission": {
    name: "The Health Commission",
    shortName: "Health Commission"
  },
  "household-affairs": {
    name: "The Household Affairs Office",
    shortName: "Household Affairs"
  },
  "music-department": {
    name: "The Music Department",
    shortName: "Music Department"
  },
  "travel-department": {
    name: "The Travel Department",
    shortName: "Travel Department"
  }
};

function weeklyFixtureIssues(data) {
  const weekStart = weekStartFor(TODAY);
  const project = data.projects[0];

  return [
    ...clone(data.issues),
    {
      id: "weekly-issue-research-1",
      date: weekStart,
      region: "research-institute",
      projectId: project.id,
      projectName: project.name,
      title: "Research sprint review",
      description: "Reviewed the deterministic report foundation.",
      duration: 120,
      moneyCostCents: 500,
      createdAt: `${weekStart}T10:00:00.000Z`,
      updatedAt: `${weekStart}T10:00:00.000Z`
    },
    {
      id: "weekly-issue-academy-1",
      date: weekStart,
      region: "academy",
      projectId: null,
      projectName: null,
      title: "Reading block",
      description: "Studied weekly reporting requirements.",
      duration: 120,
      moneyCostCents: 400,
      createdAt: `${weekStart}T09:00:00.000Z`,
      updatedAt: `${weekStart}T09:00:00.000Z`
    },
    {
      id: "weekly-issue-health-1",
      date: addUtcDays(weekStart, 1),
      region: "health-commission",
      projectId: null,
      projectName: null,
      title: "Training record",
      description: "Recorded a quiet health checkpoint.",
      duration: 45,
      moneyCostCents: 0,
      createdAt: `${addUtcDays(weekStart, 1)}T08:00:00.000Z`,
      updatedAt: `${addUtcDays(weekStart, 1)}T08:00:00.000Z`
    },
    {
      id: "weekly-issue-household-1",
      date: addUtcDays(weekStart, 2),
      region: "household-affairs",
      projectId: null,
      projectName: null,
      title: "Household supply note",
      description: "Purchased supplies for the manor.",
      duration: 0,
      moneyCostCents: 2750,
      createdAt: `${addUtcDays(weekStart, 2)}T08:30:00.000Z`,
      updatedAt: `${addUtcDays(weekStart, 2)}T08:30:00.000Z`
    }
  ];
}

function weeklyFixtureProjects(data) {
  const weekStart = weekStartFor(TODAY);

  return [
    ...clone(data.projects),
    {
      id: "weekly-project-completed",
      name: "Weekly Report Foundation",
      region: "chronicle-department",
      status: "completed",
      completedAt: `${addUtcDays(weekStart, 3)}T12:00:00.000Z`
    },
    {
      id: "weekly-project-outside",
      name: "Outside Report Range",
      region: "academy",
      status: "completed",
      completedAt: `${addUtcDays(weekStart, -2)}T12:00:00.000Z`
    }
  ];
}

function weeklyFixtureMilestones(data) {
  const weekStart = weekStartFor(TODAY);

  return [
    ...clone(data.milestones),
    {
      id: "weekly-milestone-completed",
      title: "Weekly report reviewed",
      projectId: data.projects[0].id,
      projectName: data.projects[0].name,
      targetDate: addUtcDays(weekStart, 4),
      notes: "Ready for deterministic browser rendering.",
      completed: true,
      completedAt: `${addUtcDays(weekStart, 4)}T12:00:00.000Z`
    },
    {
      id: "weekly-milestone-outside",
      title: "Outside report milestone",
      projectId: data.projects[0].id,
      projectName: data.projects[0].name,
      targetDate: addUtcDays(weekStart, -3),
      notes: "Outside the selected week.",
      completed: true,
      completedAt: `${addUtcDays(weekStart, -3)}T12:00:00.000Z`
    }
  ];
}

function compareWeeklyDepartments(first, second) {
  return (
    second.durationMinutes - first.durationMinutes ||
    second.issueCount - first.issueCount ||
    second.moneyCostCents - first.moneyCostCents ||
    first.name.localeCompare(second.name)
  );
}

function compareWeeklyProjects(first, second) {
  return (
    second.durationMinutes - first.durationMinutes ||
    second.issueCount - first.issueCount ||
    second.moneyCostCents - first.moneyCostCents ||
    first.name.localeCompare(second.name) ||
    first.id.localeCompare(second.id)
  );
}

function buildWeeklyReportResponse(data, date, today) {
  const weekStart = weekStartFor(date);
  const todayWeekStart = weekStartFor(today);

  if (weekStart > todayWeekStart) {
    return {
      error: "Choose this week or an earlier week."
    };
  }

  const weekEnd = addUtcDays(weekStart, 6);
  const effectiveEndDate =
    weekStart === todayWeekStart ? today : weekEnd;
  const issues = weeklyFixtureIssues(data)
    .filter(
      issue =>
        issue.date >= weekStart &&
        issue.date <= effectiveEndDate
    )
    .map(issue => ({
      ...issue,
      durationMinutes:
        normalizeReportNumber(issue.duration),
      moneyCostCents:
        normalizeReportNumber(issue.moneyCostCents)
    }));
  const daily = Array.from(
    { length: 7 },
    (_, index) => {
      const day = addUtcDays(weekStart, index);
      const included = day <= effectiveEndDate;
      const dayIssues = included
        ? issues.filter(issue => issue.date === day)
        : [];

      return {
        date: day,
        included,
        issueCount: dayIssues.length,
        durationMinutes: dayIssues.reduce(
          (sum, issue) => sum + issue.durationMinutes,
          0
        ),
        moneyCostCents: dayIssues.reduce(
          (sum, issue) => sum + issue.moneyCostCents,
          0
        )
      };
    }
  );
  const departments = new Map();
  const projects = new Map();

  for (const issue of issues) {
    const department =
      WEEKLY_DEPARTMENTS[issue.region] || {
        name: issue.region,
        shortName: issue.region
      };

    if (!departments.has(issue.region)) {
      departments.set(issue.region, {
        id: issue.region,
        name: department.name,
        shortName: department.shortName,
        issueCount: 0,
        durationMinutes: 0,
        moneyCostCents: 0
      });
    }

    const departmentTotal = departments.get(issue.region);
    departmentTotal.issueCount += 1;
    departmentTotal.durationMinutes += issue.durationMinutes;
    departmentTotal.moneyCostCents += issue.moneyCostCents;

    if (issue.projectId) {
      if (!projects.has(issue.projectId)) {
        projects.set(issue.projectId, {
          id: issue.projectId,
          name: issue.projectName || "Untitled Project",
          region: issue.region,
          issueCount: 0,
          durationMinutes: 0,
          moneyCostCents: 0
        });
      }

      const projectTotal = projects.get(issue.projectId);
      projectTotal.issueCount += 1;
      projectTotal.durationMinutes += issue.durationMinutes;
      projectTotal.moneyCostCents += issue.moneyCostCents;
    }
  }

  const departmentList = Array.from(departments.values())
    .sort(compareWeeklyDepartments);
  const projectList = Array.from(projects.values())
    .sort(compareWeeklyProjects);
  const completedProjects = weeklyFixtureProjects(data)
    .filter(project => {
      const completedDate = String(project.completedAt || "").slice(0, 10);
      return completedDate >= weekStart && completedDate <= effectiveEndDate;
    })
    .map(project => ({
      id: project.id,
      name: project.name,
      region: project.region,
      status: project.status,
      completedAt: project.completedAt
    }))
    .sort(
      (first, second) =>
        second.completedAt.localeCompare(first.completedAt) ||
        first.name.localeCompare(second.name) ||
        first.id.localeCompare(second.id)
    );
  const completedMilestones = weeklyFixtureMilestones(data)
    .filter(milestone => {
      const completedDate = String(milestone.completedAt || "").slice(0, 10);
      return completedDate >= weekStart && completedDate <= effectiveEndDate;
    })
    .map(milestone => ({
      id: milestone.id,
      title: milestone.title,
      projectId: milestone.projectId,
      projectName: milestone.projectName,
      targetDate: milestone.targetDate,
      completedAt: milestone.completedAt,
      notes: milestone.notes || ""
    }))
    .sort(
      (first, second) =>
        second.completedAt.localeCompare(first.completedAt) ||
        String(first.projectName || "").localeCompare(String(second.projectName || "")) ||
        first.title.localeCompare(second.title) ||
        first.id.localeCompare(second.id)
    );
  const totals = {
    issues: issues.length,
    durationMinutes: issues.reduce(
      (sum, issue) => sum + issue.durationMinutes,
      0
    ),
    moneyCostCents: issues.reduce(
      (sum, issue) => sum + issue.moneyCostCents,
      0
    ),
    activeDepartments: departmentList.length,
    activeProjects: projectList.length,
    projectsCompleted: completedProjects.length,
    milestonesCompleted: completedMilestones.length
  };
  let headline = "A Quiet Week Across the Manor";

  if (totals.issues > 0 && departmentList.length === 1) {
    headline = `${departmentList[0].name} Carried the Week`;
  } else if (totals.issues > 0 && departmentList.length > 1) {
    const first = departmentList[0];
    const second = departmentList[1];
    const uniqueLeader =
      first.durationMinutes !== second.durationMinutes ||
      first.issueCount !== second.issueCount ||
      first.moneyCostCents !== second.moneyCostCents;
    headline = uniqueLeader
      ? `${first.name} Led the Week`
      : "A Week of Work Across the Manor";
  }

  const highlights = [];
  const busiestDay = daily
    .filter(day => day.included && day.issueCount > 0)
    .sort(
      (first, second) =>
        second.issueCount - first.issueCount ||
        first.date.localeCompare(second.date)
    )[0];

  if (busiestDay) {
    highlights.push(`${busiestDay.date} carried ${busiestDay.issueCount} records.`);
  }

  if (departmentList[0]?.durationMinutes > 0) {
    highlights.push(
      `${departmentList[0].name} recorded the most time at ${departmentList[0].durationMinutes} minutes.`
    );
  }

  if (completedProjects.length > 0) {
    highlights.push(`${completedProjects.length} project reached completion.`);
  }

  if (completedMilestones.length > 0) {
    highlights.push(`${completedMilestones.length} milestone was completed.`);
  }

  return {
    date,
    today,
    weekStart,
    weekEnd,
    effectiveEndDate,
    status:
      weekStart === todayWeekStart ? "in-progress" : "complete",
    presentation: {
      headline,
      lead:
        `The manor recorded ${totals.issues} affairs across ${totals.activeDepartments} departments, ` +
        `comprising ${totals.durationMinutes} minutes of activity and ${totals.moneyCostCents} cents in recorded expenditure.`,
      highlights: highlights.slice(0, 4)
    },
    totals,
    daily,
    departments: departmentList,
    projects: projectList,
    completedProjects,
    completedMilestones,
    recentIssues: issues
      .slice()
      .sort(
        (first, second) =>
          second.date.localeCompare(first.date) ||
          String(second.createdAt || "").localeCompare(String(first.createdAt || "")) ||
          first.id.localeCompare(second.id)
      )
      .slice(0, 5)
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

  if (path === "/api/order-planner") {
    if (state.plannerStatus) {
      return json(
        route,
        {
          error:
            state.plannerError ||
            "Could not open the Order Planner."
        },
        state.plannerStatus
      );
    }

    const date = url.searchParams.get("date");
    const today = url.searchParams.get("today");

    if (
      !isValidDateString(date) ||
      !isValidDateString(today)
    ) {
      return json(
        route,
        {
          error:
            "Valid selected and local today dates are required."
        },
        400
      );
    }

    return json(
      route,
      buildOrderPlannerResponse(
        data,
        date,
        today
      )
    );
  }

  if (path === "/api/weekly-report") {
    state.weeklyReportRequests += 1;

    if (state.weeklyReportStatus) {
      return json(
        route,
        {
          error:
            state.weeklyReportError ||
            "Could not open the Weekly Estate Report."
        },
        state.weeklyReportStatus
      );
    }

    const date = url.searchParams.get("date");
    const today = url.searchParams.get("today");

    if (
      !isValidDateString(date) ||
      !isValidDateString(today)
    ) {
      return json(
        route,
        {
          error:
            "Valid selected and local today dates are required."
        },
        400
      );
    }

    if (state.weeklyReportDelay) {
      await new Promise(resolve => {
        setTimeout(
          resolve,
          state.weeklyReportDelay(
            date,
            today
          )
        );
      });
    }

    const response = buildWeeklyReportResponse(
      data,
      date,
      today
    );

    return json(
      route,
      response,
      response.error ? 400 : 200
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
    plannerStatus:
      options.plannerStatus || null,
    plannerError:
      options.plannerError || null,
    weeklyReportStatus:
      options.weeklyReportStatus || null,
    weeklyReportError:
      options.weeklyReportError || null,
    weeklyReportDelay:
      options.weeklyReportDelay || null,
    weeklyReportRequests: 0,
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
