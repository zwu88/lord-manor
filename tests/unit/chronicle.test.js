const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");

let chronicle;

test.before(async () => {
  const filePath = path.resolve(
    __dirname,
    "../../functions/_lib/chronicle.js"
  );
  const source = await readFile(filePath, "utf8");
  const moduleUrl =
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;

  chronicle = await import(moduleUrl);
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
    { id: "pending", completed: 0 },
    { id: "done", completed: 1 }
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
        pending: 1,
        completed: 1
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
        "Today's dispatch contains 2 orders (2 pending and 0 completed), 1 recorded affair, and 1 milestone overdue or due within the next seven days."
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
