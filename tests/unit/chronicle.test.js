const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");

let chronicle;
let tasksApi;

test.before(async () => {
  const filePath = path.resolve(
    __dirname,
    "../../functions/_lib/chronicle.js"
  );
  const source = await readFile(filePath, "utf8");
  const moduleUrl =
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;

  chronicle = await import(moduleUrl);

  tasksApi = await import(
    pathToFileURL(
      path.resolve(
        __dirname,
        "../../functions/api/tasks.js"
      )
    ).href
  );
});

test("validates real ISO Chronicle dates", () => {
  assert.equal(chronicle.validateChronicleDate("2026-02-28"), true);
  assert.equal(chronicle.validateChronicleDate("2024-02-29"), true);
  assert.equal(chronicle.validateChronicleDate("2026-02-29"), false);
  assert.equal(chronicle.validateChronicleDate("2026-2-9"), false);
  assert.equal(chronicle.validateChronicleDate(null), false);
});

test("adds Chronicle days with UTC calendar math", () => {
  assert.equal(chronicle.addChronicleDays("2026-12-31", 1), "2027-01-01");
  assert.equal(chronicle.addChronicleDays("2026-03-01", -1), "2026-02-28");
  assert.equal(chronicle.addChronicleDays("2024-02-28", 1), "2024-02-29");
});

test("calculates Chronicle statistics from normalized records", () => {
  const orders = chronicle.normalizeChronicleOrders([
    { id: "active-1", completed: 0 },
    { id: "active-2", completed: false }
  ]);
  const milestones = chronicle.normalizeChronicleMilestones([
    { id: "late", completed: 0, targetDate: "2026-06-26" },
    { id: "today", completed: false, targetDate: "2026-06-27" },
    { id: "soon", completed: false, targetDate: "2026-06-29" }
  ]);

  assert.deepEqual(
    chronicle.calculateChronicleStatistics(
      orders,
      [
        { duration: "15", moneyCostCents: "250" },
        { duration: null, moneyCostCents: undefined }
      ],
      milestones,
      "2026-06-27"
    ),
    {
      orders: {
        total: 2,
        pending: 2,
        completed: 0
      },
      issues: {
        total: 2,
        durationMinutes: 15,
        moneyCostCents: 250
      },
      milestones: {
        total: 3,
        overdue: 1,
        dueToday: 1,
        dueSoon: 1
      }
    }
  );
});

test("builds Chronicle presentation priority and pluralization", () => {
  assert.deepEqual(
    chronicle.buildChroniclePresentation({
      orders: {
        total: 2,
        pending: 2,
        completed: 0
      },
      issues: {
        total: 1,
        durationMinutes: 0,
        moneyCostCents: 0
      },
      milestones: {
        total: 1,
        overdue: 0,
        dueToday: 1,
        dueSoon: 0
      }
    }),
    {
      headline: "2 Orders Await Attention",
      lead:
        "Today's dispatch contains 2 orders, 1 recorded affair, and 1 milestone overdue or due within the next seven days."
    }
  );

  assert.deepEqual(
    chronicle.buildChroniclePresentation({
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
    }),
    {
      headline: "A Quiet Morning Across the Manor",
      lead:
        "Today's dispatch contains 0 orders, 0 recorded affairs, and 0 milestones overdue or due within the next seven days."
    }
  );

  assert.deepEqual(
    chronicle.buildChroniclePresentation({
      orders: {
        total: 1,
        pending: 1,
        completed: 0
      },
      issues: {
        total: 2,
        durationMinutes: 0,
        moneyCostCents: 0
      },
      milestones: {
        total: 3,
        overdue: 1,
        dueToday: 1,
        dueSoon: 1
      }
    }),
    {
      headline: "1 Order Awaits Attention",
      lead:
        "Today's dispatch contains 1 order, 2 recorded affairs, and 3 milestones overdue or due within the next seven days."
    }
  );
});

test("builds stable edition content with a format version", () => {
  const content = chronicle.buildChronicleEditionContent({
    date: "2026-06-27",
    horizonDate: "2026-07-04",
    presentation: {
      headline: "Fixture Headline",
      lead: "Fixture lead."
    },
    orders: [{ id: "order-1" }],
    issues: [{ id: "issue-1" }],
    milestones: [{ id: "milestone-1" }],
    statistics: {
      orders: {
        total: 1,
        pending: 1,
        completed: 0
      }
    }
  });

  assert.equal(content.formatVersion, chronicle.CHRONICLE_FORMAT_VERSION);
  assert.equal(content.formatVersion, 2);
  assert.deepEqual(content.orders, [{ id: "order-1" }]);
});

test("normalizes stored Chronicle editions and preserves timestamps", () => {
  const content = {
    presentation: {
      headline: "Stored Headline",
      lead: "Stored lead."
    },
    orders: [{ id: "order-1" }],
    issues: [],
    milestones: [],
    statistics: {
      orders: {
        total: 1,
        pending: 1,
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

  assert.deepEqual(
    chronicle.normalizeStoredChronicleEdition({
      editionDate: "2026-06-27",
      horizonDate: "2026-07-04",
      headline: "Row Headline",
      lead: "Row lead.",
      contentJson: JSON.stringify(content),
      formatVersion: 1,
      createdAt: "2026-06-27T10:00:00.000Z",
      updatedAt: "2026-06-27T10:30:00.000Z"
    }),
    {
      date: "2026-06-27",
      horizonDate: "2026-07-04",
      presentation: content.presentation,
      orders: content.orders,
      issues: [],
      milestones: [],
      statistics: content.statistics,
      formatVersion: 1,
      sealedAt: "2026-06-27T10:00:00.000Z",
      updatedAt: "2026-06-27T10:30:00.000Z"
    }
  );
});

test("normalizes boolean values from D1 responses", () => {
  assert.deepEqual(
    chronicle.normalizeChronicleOrders([
      { id: "true", completed: true },
      { id: "one", completed: 1 },
      { id: "string-one", completed: "1" },
      { id: "false", completed: false },
      { id: "zero", completed: 0 }
    ]).map(order => order.completed),
    [true, true, true, false, false]
  );
});

test("builds live Chronicle payloads from active Orders only", async () => {
  const preparedSql = [];
  const context = {
    env: {
      DB: {
        prepare(sql) {
          preparedSql.push(sql);

          return {
            bind() {
              return this;
            },
            async all() {
              if (sql.includes("FROM next_day_tasks")) {
                return {
                  results: [
                    {
                      id: "active-order",
                      taskDate: "2026-06-27",
                      title: "Active order",
                      completed: 0
                    }
                  ]
                };
              }

              return { results: [] };
            }
          };
        }
      }
    }
  };

  const payload = await chronicle.buildChroniclePayload(
    context,
    "2026-06-27"
  );

  assert.match(
    preparedSql.find(sql => sql.includes("FROM next_day_tasks")),
    /next_day_tasks\.completed = 0/
  );
  assert.deepEqual(payload.orders, [
    {
      id: "active-order",
      taskDate: "2026-06-27",
      title: "Active order",
      completed: false
    }
  ]);
  assert.deepEqual(payload.statistics.orders, {
    total: 1,
    pending: 1,
    completed: 0
  });
  assert.doesNotMatch(payload.presentation.lead, /pending|completed/);
});

test("resolves task completion timestamps on the server", () => {
  const now = "2026-06-27T10:00:00.000Z";
  const previous = "2026-06-26T10:00:00.000Z";

  assert.equal(
    tasksApi.resolveTaskCompletion(false, null, true, now),
    now
  );
  assert.equal(
    tasksApi.resolveTaskCompletion(true, previous, false, now),
    null
  );
  assert.equal(
    tasksApi.resolveTaskCompletion(false, null, false, now),
    null
  );
  assert.equal(
    tasksApi.resolveTaskCompletion(true, previous, true, now),
    previous
  );
});

test("rejects invalid stored edition content", () => {
  assert.throws(
    () =>
      chronicle.normalizeStoredChronicleEdition({
        contentJson: "{",
        editionDate: "2026-06-27"
      }),
    /invalid/
  );
});
