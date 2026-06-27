const { test, expect } = require("@playwright/test");
const {
  emptyChronicleResponse,
  installMockApi
} = require("./helpers/mock-api");
const { installErrorMonitor } = require("./helpers/page-errors");

async function openManor(page) {
  await installMockApi(page, { authenticated: true });
  await page.goto("/");
  await expect(page.locator("#manor-application")).toBeVisible();
  await expect(page.locator("#recent-issue-list .issue-card")).toHaveCount(2);
  await expect(page.locator("#tomorrow-task-list .office-card")).toHaveCount(1);
}

test.beforeEach(async ({ page }) => {
  page.errorMonitor = installErrorMonitor(page);
});

test.afterEach(async ({ page }) => {
  page.errorMonitor.assertNoErrors();
});

test("authenticates with the mocked private session", async ({ page }) => {
  await installMockApi(page);
  await page.goto("/");

  await expect(page.locator("#login-screen")).toBeVisible();
  await expect(page.locator("#manor-application")).toBeHidden();

  await page.locator("#login-password").fill("test-password");
  await page.getByRole("button", { name: "Enter the Estate" }).click();

  await expect(page.locator("#manor-application")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lord Wu's Manor" })).toBeVisible();

  await page.getByRole("button", { name: "Leave the Estate" }).click();
  await expect(page.locator("#login-screen")).toBeVisible();
  await expect(page.locator("#manor-application")).toBeHidden();
});

test("renders the authenticated homepage and Chronicle", async ({ page }) => {
  await openManor(page);

  await expect(page.locator("#department-grid .department-card")).toHaveCount(10);
  await expect(page.locator("#recent-issue-list")).toContainText("Smoke test fixture issue");
  await expect(page.getByRole("heading", { name: "Orders and Milestones" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Manor Chronicle" })).toBeVisible();
  await expect(page.locator("#chronicle-headline")).not.toHaveText(
    "Opening the Morning Dispatch..."
  );
});

test("opens, closes, creates, and edits issues", async ({ page }) => {
  await openManor(page);

  await page.getByRole("button", { name: "Record an Issue" }).click();
  await expect(page.locator("#issue-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator("#issue-dialog")).toBeHidden();

  await page.getByRole("button", { name: "Record an Issue" }).click();
  await page.locator("#close-dialog").click();
  await expect(page.locator("#issue-dialog")).toBeHidden();

  await page.getByRole("button", { name: "Record an Issue" }).click();
  await page.locator("#issue-title").fill("New mocked issue");
  await page.locator("#issue-description").fill("Created by the browser smoke test.");
  await page.locator("#issue-duration").fill("30");
  await page.locator("#issue-money").fill("8.25");
  await page.getByRole("button", { name: "Seal the Record" }).click();

  await expect(page.locator("#issue-dialog")).toBeHidden();
  await expect(page.locator("#recent-issue-list")).toContainText("New mocked issue");

  await page
    .locator("#recent-issue-list .issue-card")
    .filter({ hasText: "Smoke test fixture issue" })
    .getByRole("button", { name: "Edit" })
    .click();

  await expect(page.locator("#issue-dialog")).toBeVisible();
  await expect(page.locator("#issue-dialog-title")).toHaveText("Amend the Issue");
  await expect(page.locator("#issue-title")).toHaveValue("Smoke test fixture issue");
});

test("keeps Council Chamber dialogs interactive on the department page", async ({ page }) => {
  await openManor(page);

  await page.getByRole("link", { name: /The Council Chamber/ }).click();
  await expect(page.locator("#department-page")).toBeVisible();
  await expect(page.locator("#council-department-view")).toBeVisible();
  await expect(page.locator("#project-board")).toContainText("Codex Runtime Foundation");

  await page
    .locator("#project-board .project-card")
    .filter({ hasText: "Codex Runtime Foundation" })
    .getByRole("button", { name: "Edit" })
    .click();

  await expect(page.locator("#project-dialog")).toBeVisible();
  await expect(page.locator("#project-name")).toHaveValue("Codex Runtime Foundation");
  await expect(page.locator("#department-page")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator("#project-dialog")).toBeHidden();

  await page.locator("#department-back-button").click();
  await expect(page.locator("#department-grid")).toBeVisible();
});

test("opens and closes each global dialog without leaving the current page", async ({ page }) => {
  await openManor(page);

  await page.getByRole("button", { name: "Record an Issue" }).click();
  await expect(page.locator("#issue-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator("#manor-home")).toBeVisible();

  await page.getByRole("link", { name: /The Council Chamber/ }).click();
  await page.getByRole("button", { name: "Establish a Project" }).click();
  await expect(page.locator("#project-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator("#council-department-view")).toBeVisible();

  await page.locator("#department-back-button").click();
  await page.getByRole("button", { name: "Add an Order" }).click();
  await expect(page.locator("#task-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator("#manor-home")).toBeVisible();

  await page.getByRole("button", { name: "Add a Milestone" }).click();
  await expect(page.locator("#milestone-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator("#manor-home")).toBeVisible();
});

test("updates Treasury week and month controls independently", async ({ page }) => {
  await openManor(page);

  await page.getByRole("link", { name: /Treasury and Resources/ }).click();
  await expect(page.locator("#treasury-total-money")).toHaveText(/\$/);

  const moneyWeek = page.locator("[data-treasury-money-scale='week']");
  const moneyMonth = page.locator("[data-treasury-money-scale='month']");
  const timeWeek = page.locator("[data-treasury-scale='week']");
  const timeMonth = page.locator("[data-treasury-scale='month']");

  await expect(moneyWeek).toHaveClass(/is-active/);
  await expect(timeWeek).toHaveClass(/is-active/);

  await moneyMonth.click();
  await expect(moneyMonth).toHaveClass(/is-active/);
  await expect(timeWeek).toHaveClass(/is-active/);

  await timeMonth.click();
  await expect(timeMonth).toHaveClass(/is-active/);
  await expect(moneyMonth).toHaveClass(/is-active/);

  await moneyWeek.click();
  await expect(moneyWeek).toHaveClass(/is-active/);
  await expect(timeMonth).toHaveClass(/is-active/);
});

test("loads and refreshes the deterministic Manor Chronicle", async ({ page }) => {
  await openManor(page);

  await expect(page.locator("#chronicle-headline")).not.toHaveText(
    "Opening the Morning Dispatch..."
  );
  await expect(page.locator("#chronicle-headline")).toHaveText(
    "1 Order Awaits Attention"
  );
  await expect(page.locator("#chronicle-lead")).toHaveText(
    "Today's dispatch contains 2 orders (1 pending and 1 completed), 1 recorded affair, and 2 milestones overdue or due within the next seven days."
  );
  await expect(page.locator("#chronicle-task-list")).toContainText("Read the morning orders");
  await expect(page.locator("#chronicle-task-list")).toContainText("File the completed order");
  await expect(page.locator("#chronicle-issue-list")).toContainText("Smoke test fixture issue");
  await expect(page.locator("#chronicle-milestone-list")).toContainText(
    "Overdue smoke milestone"
  );
  await expect(page.locator("#chronicle-milestone-list")).toContainText("Smoke tests reviewed");
  await expect(page.locator("#chronicle-milestone-list")).not.toContainText(
    "Outside Chronicle window"
  );
  await expect(page.locator("#chronicle-milestone-list")).not.toContainText(
    "Completed Chronicle milestone"
  );

  await page.getByRole("button", { name: "Refresh Dispatch" }).click();
  await expect(page.getByRole("button", { name: "Refresh Dispatch" })).toBeEnabled();
});

test("uses one unified Chronicle request for a manual refresh", async ({ page }) => {
  await openManor(page);
  await expect(page.getByRole("button", { name: "Refresh Dispatch" })).toBeEnabled();
  await page.waitForTimeout(250);

  const chronicleRequests = [];

  page.on("request", request => {
    const url = new URL(request.url());

    if (url.pathname === "/api/chronicle") {
      chronicleRequests.push(url);
    }
  });

  await Promise.all([
    page.waitForResponse(response => {
      const url = new URL(response.url());

      return (
        url.pathname === "/api/chronicle" &&
        response.request().method() === "GET"
      );
    }),
    page.getByRole("button", { name: "Refresh Dispatch" }).click()
  ]);

  await expect(page.getByRole("button", { name: "Refresh Dispatch" })).toBeEnabled();
  await page.waitForTimeout(50);

  expect(chronicleRequests).toHaveLength(1);
  expect(chronicleRequests[0].searchParams.get("date")).toMatch(
    /^\d{4}-\d{2}-\d{2}$/
  );
});

test("shows a readable Chronicle error state", async ({ page }) => {
  page.errorMonitor.allowConsoleError(
    /Failed to load resource:.*500/
  );

  await installMockApi(page, {
    authenticated: true,
    chronicleStatus: 500,
    chronicleError: "Chronicle fixture failure."
  });

  await page.goto("/");
  await expect(page.locator("#manor-application")).toBeVisible();
  await expect(page.locator("#chronicle-headline")).toHaveText(
    "The Morning Dispatch Could Not Be Opened"
  );
  await expect(page.locator("#chronicle-lead")).toHaveText(
    "Chronicle fixture failure."
  );
  await expect(page.getByRole("button", { name: "Refresh Dispatch" })).toBeEnabled();
});

test("renders quiet Chronicle empty states", async ({ page }) => {
  const response = emptyChronicleResponse(
    new Date().toISOString().slice(0, 10)
  );

  await installMockApi(page, {
    authenticated: true,
    chronicleResponse: response
  });

  await page.goto("/");
  await expect(page.locator("#manor-application")).toBeVisible();
  await expect(page.locator("#chronicle-headline")).toHaveText(
    "A Quiet Morning Across the Manor"
  );
  await expect(page.locator("#chronicle-task-list")).toContainText(
    "No orders were prepared for today."
  );
  await expect(page.locator("#chronicle-issue-list")).toContainText(
    "No affairs have yet been entered today."
  );
  await expect(page.locator("#chronicle-milestone-list")).toContainText(
    "No overdue or near-term milestones require attention."
  );
});

test("navigates to a department and returns cleanly to the manor", async ({ page }) => {
  await openManor(page);

  await page.getByRole("link", { name: /The Academy/ }).click();
  await expect(page.locator("#department-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Academy" })).toBeVisible();

  await page.locator("#department-back-button").click();
  await expect(page.locator("#manor-home")).toBeVisible();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});
