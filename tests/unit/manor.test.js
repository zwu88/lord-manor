const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

async function loadManor(overrides = {}) {
  const source = await readFile(
    path.resolve(__dirname, "../../manor.js"),
    "utf8"
  );
  const errors = [];
  const context = vm.createContext({
    console: {
      error: (...args) => errors.push(args)
    },
    document: {
      createElement(tagName) {
        return {
          tagName,
          className: "",
          textContent: "",
          closest() {
            return null;
          }
        };
      }
    },
    fetch: overrides.fetch,
    Intl,
    Map,
    Number,
    Object,
    Promise,
    RegExp,
    Set,
    TypeError,
    window: {
      MANOR_DEPARTMENTS: [
        {
          id: "chronicle-department",
          name: "The Chronicle Department"
        }
      ],
      MANOR_SETTINGS: {
        currencyCode: "USD",
        locale: "en-US"
      },
      ...(overrides.window || {})
    }
  });

  vm.runInContext(source, context);

  return {
    errors,
    Manor: context.window.Manor,
    context,
    source
  };
}

test("emits domain events, unsubscribes listeners, and isolates failures", async () => {
  const { Manor, errors } = await loadManor();
  const calls = [];

  Manor.events.on(
    Manor.events.names.ISSUE_CHANGED,
    () => {
      throw new Error("listener failed");
    }
  );
  const unsubscribe = Manor.events.on(
    Manor.events.names.ISSUE_CHANGED,
    payload => calls.push(payload.issueId)
  );

  Manor.events.emit(
    Manor.events.names.ISSUE_CHANGED,
    {
      issueId: "issue-1"
    }
  );
  unsubscribe();
  Manor.events.emit(
    Manor.events.names.ISSUE_CHANGED,
    {
      issueId: "issue-2"
    }
  );

  assert.deepEqual(calls, ["issue-1"]);
  assert.equal(errors.length, 2);
});

test("keeps the existing namespace on duplicate script evaluation", async () => {
  const loaded = await loadManor();
  const firstManor = loaded.context.window.Manor;

  vm.runInContext(loaded.source, loaded.context);

  assert.equal(loaded.context.window.Manor, firstManor);
  assert.equal(
    loaded.context.window.Manor.coreInitialized,
    true
  );
});

test("exposes date, formatting, dom, and async utilities", async () => {
  const { Manor } = await loadManor();

  assert.equal(
    Manor.dates.isValidDateString("2026-02-28"),
    true
  );
  assert.equal(
    Manor.dates.isValidDateString("2026-02-30"),
    false
  );
  assert.equal(
    Manor.dates.addDays("2026-12-31", 1),
    "2027-01-01"
  );
  assert.equal(
    Manor.dates.weekStart("2026-06-28"),
    "2026-06-22"
  );
  assert.equal(
    Manor.dates.weekEnd("2026-06-28"),
    "2026-06-28"
  );
  assert.equal(Manor.format.duration(125), "2 hr 5 min");
  assert.equal(
    Manor.format.pluralize(2, "Issue", "Issues"),
    "Issues"
  );

  const element = Manor.dom.createElement(
    "span",
    "badge",
    "Ready"
  );
  assert.equal(element.className, "badge");
  assert.equal(element.textContent, "Ready");
  assert.equal(
    Manor.config.departmentMap[
      "chronicle-department"
    ].name,
    "The Chronicle Department"
  );

  const tracker = Manor.async.createRequestTracker();
  const first = tracker.next();
  const second = tracker.next();

  assert.equal(tracker.isCurrent(first), false);
  assert.equal(tracker.isCurrent(second), true);
});

test("fetchJson sends JSON requests and routes unauthorized responses to login", async () => {
  const requests = [];
  const { Manor, context } = await loadManor({
    fetch: async (path, init) => {
      requests.push({
        path,
        init
      });

      return {
        ok: false,
        status: 401,
        async json() {
          return {
            error: "Unauthorized"
          };
        }
      };
    },
    window: {
      loginShown: false,
      showLoginScreen() {
        this.loginShown = true;
      }
    }
  });

  await assert.rejects(
    () =>
      Manor.api.fetchJson("/api/issues", {
        method: "POST",
        body: JSON.stringify({
          title: "New issue"
        })
      }),
    /Unauthorized/
  );

  assert.equal(context.window.loginShown, true);
  assert.equal(requests[0].path, "/api/issues");
  assert.equal(
    requests[0].init.credentials,
    "same-origin"
  );
  assert.equal(
    requests[0].init.headers["Content-Type"],
    "application/json"
  );
});
