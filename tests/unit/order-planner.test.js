const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");

let planner;

test.before(async () => {
  const filePath = path.resolve(
    __dirname,
    "../../functions/_lib/order-planner.js"
  );
  const source = await readFile(filePath, "utf8");
  const chroniclePath = path.resolve(
    __dirname,
    "../../functions/_lib/chronicle.js"
  );
  const chronicleSource =
    await readFile(chroniclePath, "utf8");
  const chronicleUrl =
    `data:text/javascript;base64,${
      Buffer.from(chronicleSource).toString("base64")
    }`;
  const rewritten = source.replace(
    'from "./chronicle.js"',
    `from "${chronicleUrl}"`
  );
  const moduleUrl =
    `data:text/javascript;base64,${
      Buffer.from(rewritten).toString("base64")
    }`;

  planner = await import(moduleUrl);
});

test("validates strict real planner dates", () => {
  assert.equal(planner.validatePlannerDate("2026-02-28"), true);
  assert.equal(planner.validatePlannerDate("2026-02-31"), false);
  assert.equal(planner.validatePlannerDate("2026-2-8"), false);
});

test("builds exactly seven UTC-safe planner dates", () => {
  assert.deepEqual(
    planner.buildPlannerWeek("2026-12-29").map(day => day.date),
    [
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
      "2027-01-04"
    ]
  );

  assert.deepEqual(
    planner.buildPlannerWeek("2024-02-27").map(day => day.date),
    [
      "2024-02-27",
      "2024-02-28",
      "2024-02-29",
      "2024-03-01",
      "2024-03-02",
      "2024-03-03",
      "2024-03-04"
    ]
  );
});

test("counts active Orders and excludes completed Orders", () => {
  const week = planner.buildPlannerWeek("2026-06-28");

  assert.deepEqual(
    planner.countActiveOrdersByDate(
      [
        { taskDate: "2026-06-28", completed: 0 },
        { taskDate: "2026-06-28", completed: true },
        { taskDate: "2026-06-29", completed: false },
        { taskDate: "2026-07-05", completed: false }
      ],
      week
    ),
    [
      { date: "2026-06-28", activeCount: 1 },
      { date: "2026-06-29", activeCount: 1 },
      { date: "2026-06-30", activeCount: 0 },
      { date: "2026-07-01", activeCount: 0 },
      { date: "2026-07-02", activeCount: 0 },
      { date: "2026-07-03", activeCount: 0 },
      { date: "2026-07-04", activeCount: 0 }
    ]
  );
});

test("normalizes planner response shape", () => {
  assert.deepEqual(
    planner.buildPlannerResponse({
      selectedDate: "2026-06-27",
      today: "2026-06-28",
      selectedOrders: [
        { id: "selected", completed: 0 }
      ],
      overdueOrders: [
        { id: "overdue", completed: "1" }
      ],
      week: [
        { date: "2026-06-28", activeCount: 0 }
      ]
    }),
    {
      selectedDate: "2026-06-27",
      today: "2026-06-28",
      tomorrow: "2026-06-29",
      weekStart: "2026-06-28",
      weekEnd: "2026-07-04",
      selectedOrders: [
        { id: "selected", completed: false }
      ],
      overdueOrders: [
        { id: "overdue", completed: true }
      ],
      week: [
        { date: "2026-06-28", activeCount: 0 }
      ]
    }
  );
});
