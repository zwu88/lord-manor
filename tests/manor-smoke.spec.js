const { test, expect } = require("@playwright/test");
const { installMockApi } = require("./helpers/mock-api");
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
  await expect(page.locator("#chronicle-task-list")).toContainText("Read the morning orders");
  await expect(page.locator("#chronicle-issue-list")).toContainText("Smoke test fixture issue");
  await expect(page.locator("#chronicle-milestone-list")).toContainText("Smoke tests reviewed");

  await page.getByRole("button", { name: "Refresh Dispatch" }).click();
  await expect(page.getByRole("button", { name: "Refresh Dispatch" })).toBeEnabled();
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
