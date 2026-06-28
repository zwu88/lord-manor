const MILLISECONDS_PER_DAY = 86_400_000;

const DEPARTMENTS = Object.freeze([
  {
    id: "research-institute",
    name: "The Research Institute",
    shortName: "Research Institute"
  },
  {
    id: "academy",
    name: "The Academy",
    shortName: "Academy"
  },
  {
    id: "health-commission",
    name: "The Health Commission",
    shortName: "Health Commission"
  },
  {
    id: "household-affairs",
    name: "The Household Affairs Office",
    shortName: "Household Affairs"
  },
  {
    id: "music-department",
    name: "The Music Department",
    shortName: "Music Department"
  },
  {
    id: "external-relations",
    name: "The External Relations Office",
    shortName: "External Relations"
  },
  {
    id: "travel-department",
    name: "The Travel Department",
    shortName: "Travel Department"
  },
  {
    id: "council-chamber",
    name: "The Council Chamber",
    shortName: "Council Chamber"
  },
  {
    id: "chronicle-department",
    name: "The Chronicle Department",
    shortName: "Chronicle Department"
  },
  {
    id: "treasury-office",
    name: "The Treasury and Resources Office",
    shortName: "Treasury and Resources"
  }
]);

export const WEEKLY_REPORT_DEPARTMENT_MAP =
  Object.freeze(
    Object.fromEntries(
      DEPARTMENTS.map(department => [
        department.id,
        department
      ])
    )
  );

export function validateWeeklyReportDate(value) {
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
    date.toISOString().slice(0, 10) === value
  );
}

export function addDays(dateString, days) {
  const date = new Date(
    `${dateString}T00:00:00.000Z`
  );

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

export function getMondayForDate(dateString) {
  const date = new Date(
    `${dateString}T00:00:00.000Z`
  );
  const day = date.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;

  date.setUTCDate(
    date.getUTCDate() - daysSinceMonday
  );

  return date.toISOString().slice(0, 10);
}

export function getWeeklyReportRange(
  date,
  today
) {
  const weekStart = getMondayForDate(date);
  const todayWeekStart = getMondayForDate(today);

  if (weekStart > todayWeekStart) {
    throw new Error("FUTURE_WEEK");
  }

  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek =
    weekStart === todayWeekStart;

  return {
    date,
    today,
    weekStart,
    weekEnd,
    effectiveEndDate: isCurrentWeek
      ? today
      : weekEnd,
    status: isCurrentWeek
      ? "in-progress"
      : "complete"
  };
}

export function buildWeekDays(
  weekStart,
  effectiveEndDate
) {
  return Array.from(
    {
      length: 7
    },
    (_, index) => {
      const date = addDays(weekStart, index);

      return {
        date,
        included: date <= effectiveEndDate,
        issueCount: 0,
        durationMinutes: 0,
        moneyCostCents: 0
      };
    }
  );
}

export function normalizeInteger(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.trunc(number);
}

export function normalizeIssue(issue) {
  return {
    id: String(issue.id ?? ""),
    date: String(issue.date ?? ""),
    region: String(issue.region ?? ""),
    title: String(issue.title ?? ""),
    description: String(
      issue.description ?? ""
    ),
    durationMinutes:
      normalizeInteger(issue.duration),
    moneyCostCents:
      normalizeInteger(issue.moneyCostCents),
    projectId: issue.projectId || null,
    projectName: issue.projectName || null,
    createdAt: issue.createdAt || "",
    updatedAt: issue.updatedAt || ""
  };
}

function compareByName(first, second) {
  return first.localeCompare(second);
}

export function compareDepartments(
  first,
  second
) {
  return (
    second.durationMinutes -
      first.durationMinutes ||
    second.issueCount - first.issueCount ||
    second.moneyCostCents -
      first.moneyCostCents ||
    compareByName(first.name, second.name)
  );
}

function compareDepartmentMetrics(
  first,
  second
) {
  return (
    second.durationMinutes -
      first.durationMinutes ||
    second.issueCount - first.issueCount ||
    second.moneyCostCents -
      first.moneyCostCents
  );
}

export function compareProjects(
  first,
  second
) {
  return (
    second.durationMinutes -
      first.durationMinutes ||
    second.issueCount - first.issueCount ||
    second.moneyCostCents -
      first.moneyCostCents ||
    compareByName(first.name, second.name) ||
    compareByName(first.id, second.id)
  );
}

export function compareRecentIssues(
  first,
  second
) {
  return (
    second.date.localeCompare(first.date) ||
    String(second.createdAt).localeCompare(
      String(first.createdAt)
    ) ||
    String(first.id).localeCompare(
      String(second.id)
    )
  );
}

export function compareCompletedProjects(
  first,
  second
) {
  return (
    String(second.completedAt).localeCompare(
      String(first.completedAt)
    ) ||
    compareByName(first.name, second.name) ||
    compareByName(first.id, second.id)
  );
}

export function compareCompletedMilestones(
  first,
  second
) {
  return (
    String(second.completedAt).localeCompare(
      String(first.completedAt)
    ) ||
    compareByName(
      first.projectName || "",
      second.projectName || ""
    ) ||
    compareByName(first.title, second.title) ||
    compareByName(first.id, second.id)
  );
}

export function aggregateIssues(
  issues,
  weekStart,
  effectiveEndDate
) {
  const normalizedIssues =
    issues.map(normalizeIssue);
  const daily = buildWeekDays(
    weekStart,
    effectiveEndDate
  );
  const dailyByDate = new Map(
    daily.map(day => [day.date, day])
  );
  const departments = new Map();
  const projects = new Map();

  for (const issue of normalizedIssues) {
    const day = dailyByDate.get(issue.date);

    if (day?.included) {
      day.issueCount += 1;
      day.durationMinutes +=
        issue.durationMinutes;
      day.moneyCostCents +=
        issue.moneyCostCents;
    }

    const department =
      WEEKLY_REPORT_DEPARTMENT_MAP[
        issue.region
      ] ?? {
        id: issue.region,
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

    const departmentTotal =
      departments.get(issue.region);
    departmentTotal.issueCount += 1;
    departmentTotal.durationMinutes +=
      issue.durationMinutes;
    departmentTotal.moneyCostCents +=
      issue.moneyCostCents;

    if (issue.projectId) {
      if (!projects.has(issue.projectId)) {
        projects.set(issue.projectId, {
          id: issue.projectId,
          name:
            issue.projectName ||
            "Untitled Project",
          region: issue.region,
          issueCount: 0,
          durationMinutes: 0,
          moneyCostCents: 0
        });
      }

      const projectTotal = projects.get(
        issue.projectId
      );
      projectTotal.issueCount += 1;
      projectTotal.durationMinutes +=
        issue.durationMinutes;
      projectTotal.moneyCostCents +=
        issue.moneyCostCents;
    }
  }

  return {
    issues: normalizedIssues,
    daily,
    departments: Array.from(
      departments.values()
    ).sort(compareDepartments),
    projects: Array.from(
      projects.values()
    ).sort(compareProjects)
  };
}

export function buildTotals({
  issues,
  departments,
  projects,
  completedProjects,
  completedMilestones
}) {
  return {
    issues: issues.length,
    durationMinutes: issues.reduce(
      (total, issue) =>
        total + issue.durationMinutes,
      0
    ),
    moneyCostCents: issues.reduce(
      (total, issue) =>
        total + issue.moneyCostCents,
      0
    ),
    activeDepartments: departments.length,
    activeProjects: projects.length,
    projectsCompleted:
      completedProjects.length,
    milestonesCompleted:
      completedMilestones.length
  };
}

function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

function buildLead(totals) {
  return (
    `The manor recorded ${totals.issues} ` +
    `${pluralize(totals.issues, "affair", "affairs")} ` +
    `across ${totals.activeDepartments} ` +
    `${pluralize(totals.activeDepartments, "department", "departments")}, ` +
    `comprising ${totals.durationMinutes} minutes of activity ` +
    `and ${totals.moneyCostCents} cents in recorded expenditure.`
  );
}

function datePart(value) {
  return typeof value === "string"
    ? value.slice(0, 10)
    : "";
}

function isWithinRange(value, range) {
  const date = datePart(value);

  return (
    validateWeeklyReportDate(date) &&
    date >= range.weekStart &&
    date <= range.effectiveEndDate
  );
}

export function buildPresentation({
  daily,
  departments,
  projects,
  totals
}) {
  let headline;

  if (totals.issues === 0) {
    headline = "A Quiet Week Across the Manor";
  } else if (departments.length === 1) {
    headline =
      `${departments[0].name} Carried the Week`;
  } else if (
    departments.length > 1 &&
    compareDepartmentMetrics(
      departments[0],
      departments[1]
    ) !== 0
  ) {
    headline =
      `${departments[0].name} Led the Week`;
  } else {
    headline =
      "A Week of Work Across the Manor";
  }

  const highlights = [];
  const includedDays = daily.filter(
    day => day.included
  );
  const busiestDay = includedDays
    .filter(day => day.issueCount > 0)
    .sort(
      (first, second) =>
        second.issueCount - first.issueCount ||
        first.date.localeCompare(second.date)
    )[0];

  if (busiestDay) {
    highlights.push(
      `${busiestDay.date} carried ${busiestDay.issueCount} ` +
        `${pluralize(busiestDay.issueCount, "record", "records")}.`
    );
  }

  const timeDepartment = departments.find(
    department =>
      department.durationMinutes > 0
  );

  if (timeDepartment) {
    highlights.push(
      `${timeDepartment.name} recorded the most time at ` +
        `${timeDepartment.durationMinutes} minutes.`
    );
  }

  const spendingDepartment = [...departments]
    .filter(
      department =>
        department.moneyCostCents > 0
    )
    .sort(
      (first, second) =>
        second.moneyCostCents -
          first.moneyCostCents ||
        compareDepartments(first, second)
    )[0];

  if (spendingDepartment) {
    highlights.push(
      `${spendingDepartment.name} recorded the highest expenditure at ` +
        `${spendingDepartment.moneyCostCents} cents.`
    );
  }

  if (totals.projectsCompleted > 0) {
    highlights.push(
      `${totals.projectsCompleted} ` +
        `${pluralize(totals.projectsCompleted, "project", "projects")} ` +
        "reached completion."
    );
  }

  if (
    highlights.length < 4 &&
    totals.milestonesCompleted > 0
  ) {
    highlights.push(
      `${totals.milestonesCompleted} ` +
        `${pluralize(totals.milestonesCompleted, "milestone", "milestones")} ` +
        "were completed."
    );
  }

  if (
    highlights.length < 4 &&
    projects.reduce(
      (total, project) =>
        total + project.issueCount,
      0
    ) > 0
  ) {
    const linkedIssues = projects.reduce(
      (total, project) =>
        total + project.issueCount,
      0
    );

    highlights.push(
      `${linkedIssues} project-linked ` +
        `${pluralize(linkedIssues, "record", "records")} ` +
        "advanced council work."
    );
  }

  return {
    headline,
    lead: buildLead(totals),
    highlights: highlights.slice(0, 4)
  };
}

export function buildWeeklyReportResponse({
  date,
  today,
  issues = [],
  completedProjects = [],
  completedMilestones = []
}) {
  const range = getWeeklyReportRange(
    date,
    today
  );
  const aggregation = aggregateIssues(
    issues,
    range.weekStart,
    range.effectiveEndDate
  );
  const normalizedCompletedProjects =
    completedProjects
      .filter(project =>
        isWithinRange(
          project.completedAt,
          range
        )
      )
      .map(project => ({
        id: String(project.id ?? ""),
        name: String(project.name ?? ""),
        region: String(project.region ?? ""),
        status: String(
          project.status ?? ""
        ),
        completedAt:
          project.completedAt || null
      }))
      .sort(compareCompletedProjects);
  const normalizedCompletedMilestones =
    completedMilestones
      .filter(milestone =>
        isWithinRange(
          milestone.completedAt,
          range
        )
      )
      .map(milestone => ({
        id: String(milestone.id ?? ""),
        title: String(
          milestone.title ?? ""
        ),
        projectId:
          milestone.projectId || null,
        projectName:
          milestone.projectName || null,
        targetDate:
          milestone.targetDate || null,
        completedAt:
          milestone.completedAt || null,
        notes: String(
          milestone.notes ?? ""
        )
      }))
      .sort(compareCompletedMilestones);
  const totals = buildTotals({
    issues: aggregation.issues,
    departments: aggregation.departments,
    projects: aggregation.projects,
    completedProjects:
      normalizedCompletedProjects,
    completedMilestones:
      normalizedCompletedMilestones
  });

  return {
    ...range,
    presentation: buildPresentation({
      daily: aggregation.daily,
      departments: aggregation.departments,
      projects: aggregation.projects,
      totals
    }),
    totals,
    daily: aggregation.daily,
    departments: aggregation.departments,
    projects: aggregation.projects,
    completedProjects:
      normalizedCompletedProjects,
    completedMilestones:
      normalizedCompletedMilestones,
    recentIssues: aggregation.issues
      .slice()
      .sort(compareRecentIssues)
      .slice(0, 5)
  };
}
