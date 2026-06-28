import test from "node:test";
import assert from "node:assert/strict";

import {
  aggregateIssues,
  buildWeeklyReportResponse,
  getMondayForDate,
  getWeeklyReportRange,
  normalizeInteger,
  validateWeeklyReportDate
} from "../../functions/_lib/weekly-report.js";

test("validates strict real weekly report dates", () => {
  assert.equal(
    validateWeeklyReportDate("2026-06-28"),
    true
  );
  assert.equal(
    validateWeeklyReportDate("2026-02-29"),
    false
  );
  assert.equal(
    validateWeeklyReportDate("2026-6-28"),
    false
  );
  assert.equal(
    validateWeeklyReportDate("not-a-date"),
    false
  );
});

test("calculates Monday week starts and Sunday week ends across boundaries", () => {
  assert.equal(
    getMondayForDate("2026-06-28"),
    "2026-06-22"
  );
  assert.equal(
    getMondayForDate("2026-06-29"),
    "2026-06-29"
  );
  assert.equal(
    getWeeklyReportRange(
      "2026-07-01",
      "2026-07-08"
    ).weekEnd,
    "2026-07-05"
  );
  assert.equal(
    getWeeklyReportRange(
      "2026-01-01",
      "2026-01-10"
    ).weekStart,
    "2025-12-29"
  );
  assert.equal(
    getWeeklyReportRange(
      "2024-02-29",
      "2024-03-04"
    ).weekStart,
    "2024-02-26"
  );
});

test("uses local today for current-week effective end and rejects future weeks", () => {
  const range = getWeeklyReportRange(
    "2026-06-24",
    "2026-06-26"
  );

  assert.equal(range.weekStart, "2026-06-22");
  assert.equal(range.weekEnd, "2026-06-28");
  assert.equal(
    range.effectiveEndDate,
    "2026-06-26"
  );
  assert.equal(range.status, "in-progress");

  assert.throws(
    () =>
      getWeeklyReportRange(
        "2026-06-29",
        "2026-06-28"
      ),
    /FUTURE_WEEK/
  );
});

test("normalizes invalid numeric values to integer report totals", () => {
  assert.equal(normalizeInteger(null), 0);
  assert.equal(normalizeInteger(undefined), 0);
  assert.equal(normalizeInteger("bad"), 0);
  assert.equal(normalizeInteger(Infinity), 0);
  assert.equal(normalizeInteger("42.9"), 42);
});

test("aggregates daily, department, and project activity deterministically", () => {
  const aggregation = aggregateIssues(
    [
      {
        id: "issue-1",
        date: "2026-06-22",
        region: "academy",
        title: "Study",
        duration: 60,
        moneyCostCents: 200,
        projectId: "project-b",
        projectName: "Beta",
        createdAt: "2026-06-22T10:00:00.000Z"
      },
      {
        id: "issue-2",
        date: "2026-06-22",
        region: "research-institute",
        title: "Research",
        duration: 60,
        moneyCostCents: 300,
        projectId: "project-a",
        projectName: "Alpha",
        createdAt: "2026-06-22T09:00:00.000Z"
      },
      {
        id: "issue-3",
        date: "2026-06-23",
        region: "health-commission",
        title: "Walk",
        duration: 0,
        moneyCostCents: 0,
        projectId: null,
        createdAt: "2026-06-23T09:00:00.000Z"
      },
      {
        id: "issue-4",
        date: "2026-06-27",
        region: "academy",
        title: "Future in current week",
        duration: 120,
        moneyCostCents: 1000,
        projectId: null,
        createdAt: "2026-06-27T09:00:00.000Z"
      }
    ],
    "2026-06-22",
    "2026-06-26"
  );

  assert.equal(aggregation.daily.length, 7);
  assert.deepEqual(
    aggregation.daily.map(day => day.included),
    [true, true, true, true, true, false, false]
  );
  assert.equal(
    aggregation.daily[0].issueCount,
    2
  );
  assert.equal(
    aggregation.daily[5].durationMinutes,
    0
  );
  assert.deepEqual(
    aggregation.departments.map(
      department => department.id
    ),
    [
      "academy",
      "research-institute",
      "health-commission"
    ]
  );
  assert.deepEqual(
    aggregation.projects.map(
      project => project.id
    ),
    ["project-a", "project-b"]
  );
});

test("builds normalized response with totals, recent issues, completions, and presentation", () => {
  const response = buildWeeklyReportResponse({
    date: "2026-06-25",
    today: "2026-07-01",
    issues: [
      {
        id: "issue-1",
        date: "2026-06-26",
        region: "academy",
        title: "Course",
        description: "A recorded lesson.",
        duration: 45,
        moneyCostCents: 500,
        projectId: null,
        createdAt: "2026-06-26T12:00:00.000Z"
      },
      {
        id: "issue-2",
        date: "2026-06-27",
        region: "academy",
        title: "Reading",
        description: "",
        duration: null,
        moneyCostCents: null,
        projectId: "project-1",
        projectName: "Learning",
        createdAt: "2026-06-27T12:00:00.000Z"
      },
      {
        id: "issue-3",
        date: "2026-06-27",
        region: "research-institute",
        title: "Experiment",
        description: "",
        duration: 45,
        moneyCostCents: 250,
        projectId: "project-2",
        projectName: "Research",
        createdAt: "2026-06-27T13:00:00.000Z"
      },
      {
        id: "issue-4",
        date: "2026-06-25",
        region: "health-commission",
        title: "Health",
        description: "",
        duration: 15,
        moneyCostCents: 0,
        projectId: null,
        createdAt: "2026-06-25T13:00:00.000Z"
      },
      {
        id: "issue-5",
        date: "2026-06-24",
        region: "music-department",
        title: "Practice",
        description: "",
        duration: 20,
        moneyCostCents: 0,
        projectId: null,
        createdAt: "2026-06-24T13:00:00.000Z"
      },
      {
        id: "issue-6",
        date: "2026-06-23",
        region: "travel-department",
        title: "Plan",
        description: "",
        duration: 25,
        moneyCostCents: 0,
        projectId: null,
        createdAt: "2026-06-23T13:00:00.000Z"
      }
    ],
    completedProjects: [
      {
        id: "project-in",
        name: "In Range",
        region: "academy",
        status: "completed",
        completedAt: "2026-06-27T10:00:00.000Z"
      },
      {
        id: "project-other",
        name: "Also In Range",
        region: "academy",
        status: "completed",
        completedAt: "2026-06-27T09:00:00.000Z"
      },
      {
        id: "project-out",
        name: "Out of Range",
        region: "academy",
        status: "completed",
        completedAt: "2026-06-21T09:00:00.000Z"
      }
    ],
    completedMilestones: [
      {
        id: "milestone-1",
        title: "Finish outline",
        projectId: "project-in",
        projectName: "In Range",
        targetDate: "2026-06-26",
        completedAt: "2026-06-26T10:00:00.000Z",
        notes: "Done"
      },
      {
        id: "milestone-out",
        title: "Outside",
        projectId: "project-in",
        projectName: "In Range",
        targetDate: "2026-06-20",
        completedAt: "2026-06-21T10:00:00.000Z",
        notes: "Out"
      }
    ]
  });

  assert.equal(response.status, "complete");
  assert.equal(response.weekStart, "2026-06-22");
  assert.equal(response.weekEnd, "2026-06-28");
  assert.equal(
    response.effectiveEndDate,
    "2026-06-28"
  );
  assert.equal(response.daily.length, 7);
  assert.deepEqual(response.totals, {
    issues: 6,
    durationMinutes: 150,
    moneyCostCents: 750,
    activeDepartments: 5,
    activeProjects: 2,
    projectsCompleted: 2,
    milestonesCompleted: 1
  });
  assert.equal(response.recentIssues.length, 5);
  assert.deepEqual(
    response.recentIssues.map(issue => issue.id),
    [
      "issue-3",
      "issue-2",
      "issue-1",
      "issue-4",
      "issue-5"
    ]
  );
  assert.deepEqual(
    response.completedProjects.map(
      project => project.id
    ),
    ["project-in", "project-other"]
  );
  assert.match(
    response.presentation.headline,
    /Led the Week|Across the Manor/
  );
  assert.ok(
    response.presentation.highlights.length <= 4
  );
});

test("presents empty, one-department, and tied multi-department weeks deterministically", () => {
  const empty = buildWeeklyReportResponse({
    date: "2026-06-09",
    today: "2026-06-28",
    issues: []
  });

  assert.equal(
    empty.presentation.headline,
    "A Quiet Week Across the Manor"
  );
  assert.deepEqual(
    empty.presentation.highlights,
    []
  );

  const oneDepartment =
    buildWeeklyReportResponse({
      date: "2026-06-09",
      today: "2026-06-28",
      issues: [
        {
          id: "issue-1",
          date: "2026-06-09",
          region: "academy",
          title: "Study",
          duration: 10,
          moneyCostCents: 0,
          createdAt:
            "2026-06-09T10:00:00.000Z"
        }
      ]
    });

  assert.equal(
    oneDepartment.presentation.headline,
    "The Academy Carried the Week"
  );

  const tied = buildWeeklyReportResponse({
    date: "2026-06-09",
    today: "2026-06-28",
    issues: [
      {
        id: "issue-1",
        date: "2026-06-09",
        region: "academy",
        title: "Study",
        duration: 10,
        moneyCostCents: 0,
        createdAt:
          "2026-06-09T10:00:00.000Z"
      },
      {
        id: "issue-2",
        date: "2026-06-10",
        region: "research-institute",
        title: "Research",
        duration: 10,
        moneyCostCents: 0,
        createdAt:
          "2026-06-10T10:00:00.000Z"
      }
    ]
  });

  assert.equal(
    tied.presentation.headline,
    "A Week of Work Across the Manor"
  );
});
