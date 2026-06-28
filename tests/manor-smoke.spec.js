const { test, expect } = require("@playwright/test");
const {
  emptyChronicleResponse,
  installMockApi
} = require("./helpers/mock-api");
const { installErrorMonitor } = require("./helpers/page-errors");

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function openManor(page, options = {}) {
  const fixture = await installMockApi(page, {
    authenticated: true,
    ...options
  });

  await page.goto("/");
  await expect(page.locator("#manor-application")).toBeVisible();
  await expect(page.locator("#recent-issue-list .issue-card")).toHaveCount(2);
  await expect(page.locator("#tomorrow-task-list .office-card")).toHaveCount(2);

  return fixture;
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
  await expect(page.locator("#chronicle-edition-status")).toHaveText("Sealed Edition");
});

test("shows only active tomorrow Orders in the planning list", async ({ page }) => {
  await openManor(page);

  const taskList = page.locator("#tomorrow-task-list");

  await expect(taskList).toContainText("Prepare browser smoke review");
  await expect(taskList).toContainText("Draft the council docket");
  await expect(taskList).not.toContainText("Completed early tomorrow order");
  await expect(taskList).not.toContainText("Pending");
  await expect(taskList).not.toContainText("Completed");
  await expect(taskList.getByRole("button", { name: "Reopen" })).toHaveCount(0);
  await expect(taskList.getByRole("button", { name: "Done Today" })).toHaveCount(2);
});

test("defaults the Order Planner to tomorrow with a seven-day summary", async ({ page }) => {
  const fixture = await openManor(page);

  await expect(page.locator("#planner-heading")).toHaveText("Orders for Tomorrow");
  await expect(page.locator("#planner-date-input")).toHaveValue(fixture.tomorrow);
  await expect(page.locator("#planner-week .planner-day")).toHaveCount(7);
  await expect(
    page.locator("#planner-week .planner-day").filter({ hasText: "0 Orders" })
  ).toHaveCount(3);
  await expect(
    page.locator("#planner-week .planner-day").filter({ hasText: "Tomorrow" })
  ).toHaveCount(0);
  await expect(
    page.locator(`#planner-week .planner-day[data-date="${fixture.tomorrow}"]`)
  ).toHaveAttribute("aria-current", "date");
  await expect(page.locator("#tomorrow-task-list")).toContainText(
    "Prepare browser smoke review"
  );
  await expect(page.locator("#tomorrow-task-list")).not.toContainText(
    "Completed early tomorrow order"
  );
});

test("navigates Order Planner dates and avoids stale selected-day responses", async ({ page }) => {
  const fixture = await openManor(page);
  const dayThree = addDays(fixture.today, 3);

  await page.getByRole("button", { name: "Previous Day" }).first().click();
  await expect(page.locator("#planner-date-input")).toHaveValue(fixture.today);
  await expect(page.locator("#tomorrow-task-list")).toContainText("Read the morning orders");

  await page.getByRole("button", { name: "Next Day" }).first().click();
  await expect(page.locator("#planner-date-input")).toHaveValue(fixture.tomorrow);

  await page.getByRole("button", { name: "Today" }).first().click();
  await expect(page.locator("#planner-date-input")).toHaveValue(fixture.today);

  await page.getByRole("button", { name: "Tomorrow" }).click();
  await expect(page.locator("#planner-date-input")).toHaveValue(fixture.tomorrow);

  await page.locator("#planner-date-input").evaluate((input, value) => {
    input.value = value;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, dayThree);
  await expect(page.locator("#planner-date-input")).toHaveValue(dayThree);
  await expect(page.locator("#tomorrow-task-list")).toContainText("Prepare third-day order");

  await Promise.all([
    page.locator(`#planner-week .planner-day[data-date="${fixture.today}"]`).click(),
    page.locator(`#planner-week .planner-day[data-date="${fixture.tomorrow}"]`).click()
  ]);
  await expect(page.locator("#planner-date-input")).toHaveValue(fixture.tomorrow);
  await expect(page.locator("#tomorrow-task-list")).toContainText(
    "Prepare browser smoke review"
  );
});

test("creates and reschedules Orders through the dated planner", async ({ page }) => {
  const fixture = await openManor(page);
  const dayThree = addDays(fixture.today, 3);
  const dayFive = addDays(fixture.today, 5);
  const taskRequests = [];

  page.on("request", request => {
    const url = new URL(request.url());

    if (url.pathname === "/api/tasks" && ["POST", "PUT"].includes(request.method())) {
      taskRequests.push({
        method: request.method(),
        body: JSON.parse(request.postData() || "{}")
      });
    }
  });

  await page.locator(`#planner-week .planner-day[data-date="${dayThree}"]`).click();
  await page.getByRole("button", { name: "Add an Order" }).click();
  await expect(page.locator("#task-date")).toHaveValue(dayThree);
  await page.locator("#task-title").fill("New dated planner order");
  await page.locator("#task-description").fill("Created for a selected future date.");
  await page.getByRole("button", { name: "Seal the Order" }).click();

  await expect(page.locator("#task-dialog")).toBeHidden();
  await expect(page.locator("#tomorrow-task-list")).toContainText("New dated planner order");
  expect(taskRequests.at(-1)).toMatchObject({
    method: "POST",
    body: {
      taskDate: dayThree,
      title: "New dated planner order"
    }
  });
  expect(taskRequests.at(-1).body).not.toHaveProperty("completedAt");

  await page
    .locator("#tomorrow-task-list .office-card")
    .filter({ hasText: "New dated planner order" })
    .getByRole("button", { name: "Edit" })
    .click();
  await page.locator("#task-date").fill(dayFive);
  await page.getByRole("button", { name: "Save the Amendment" }).click();
  await expect(page.locator("#tomorrow-task-list")).not.toContainText(
    "New dated planner order"
  );
  expect(taskRequests.at(-1)).toMatchObject({
    method: "PUT",
    body: {
      taskDate: dayFive,
      title: "New dated planner order"
    }
  });
  expect(taskRequests.at(-1).body).not.toHaveProperty("completedAt");
  expect(taskRequests.at(-1).body).not.toHaveProperty("completed");

  await page.locator(`#planner-week .planner-day[data-date="${dayFive}"]`).click();
  await expect(page.locator("#tomorrow-task-list")).toContainText("New dated planner order");
});

test("prevents ordinary creation for a past planner date", async ({ page }) => {
  const fixture = await openManor(page);
  const pastDate = addDays(fixture.today, -3);

  await page.locator("#planner-date-input").evaluate((input, value) => {
    input.value = value;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, pastDate);
  await expect(page.locator("#tomorrow-task-list")).toContainText("Overdue archive review");

  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Add an Order" }).click();
  await expect(page.locator("#task-date")).toHaveValue(pastDate);
  await page.locator("#task-title").fill("Invalid past order");
  await page.getByRole("button", { name: "Seal the Order" }).click();
  await expect(page.locator("#task-dialog")).toBeVisible();
  await expect(page.locator("#task-date-error")).toContainText(
    "today or a future date"
  );
});

test("renders and reschedules overdue Orders without duplicate selected-day cards", async ({ page }) => {
  const fixture = await openManor(page);
  const overdueDate = addDays(fixture.today, -3);

  await expect(page.locator("#overdue-task-list")).toContainText("Overdue archive review");
  await expect(page.locator("#overdue-task-list")).toContainText("Overdue garden note");
  await expect(page.locator("#overdue-task-list")).not.toContainText("Completed historical order");

  await page.locator("#planner-date-input").evaluate((input, value) => {
    input.value = value;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, overdueDate);
  await expect(page.locator("#tomorrow-task-list")).toContainText("Overdue archive review");
  await expect(page.locator("#overdue-task-list")).not.toContainText("Overdue archive review");

  await page
    .locator("#tomorrow-task-list .office-card")
    .filter({ hasText: "Overdue archive review" })
    .getByRole("button", { name: "Edit" })
    .click();
  await page.locator("#task-date").fill(fixture.today);
  await page.getByRole("button", { name: "Save the Amendment" }).click();
  await expect(page.locator("#tomorrow-task-list")).not.toContainText("Overdue archive review");

  await page.getByRole("button", { name: "Today" }).first().click();
  await expect(page.locator("#tomorrow-task-list")).toContainText("Overdue archive review");
  await expect(page.locator("#overdue-task-list")).not.toContainText("Overdue archive review");
});

test("rescheduling an Order refreshes a live Chronicle reconstruction", async ({ page }) => {
  page.errorMonitor.allowConsoleError(/Failed to load resource:.*404/);

  const liveFixture = await openManor(page, { noTodayEdition: true });
  await expect(page.locator("#chronicle-edition-status")).toHaveText(
    "Unsealed Reconstruction"
  );
  await expect(page.locator("#chronicle-task-list")).toContainText(
    "Read the morning orders"
  );

  await page.getByRole("button", { name: "Today" }).first().click();
  await page
    .locator("#tomorrow-task-list .office-card")
    .filter({ hasText: "Read the morning orders" })
    .getByRole("button", { name: "Edit" })
    .click();
  await page.locator("#task-date").fill(liveFixture.tomorrow);
  await page.getByRole("button", { name: "Save the Amendment" }).click();
  await expect(page.locator("#chronicle-task-list")).not.toContainText(
    "Read the morning orders"
  );
});

test("rescheduling an Order preserves a sealed Chronicle until regeneration", async ({ page }) => {
  const sealedFixture = await openManor(page);
  await expect(page.locator("#chronicle-edition-status")).toHaveText("Sealed Edition");
  await expect(page.locator("#chronicle-task-list")).toContainText(
    "Read the morning orders"
  );

  await page.getByRole("button", { name: "Today" }).first().click();
  await page
    .locator("#tomorrow-task-list .office-card")
    .filter({ hasText: "Read the morning orders" })
    .getByRole("button", { name: "Edit" })
    .click();
  await page.locator("#task-date").fill(sealedFixture.tomorrow);
  await page.getByRole("button", { name: "Save the Amendment" }).click();
  await expect(page.locator("#chronicle-task-list")).toContainText(
    "Read the morning orders"
  );

  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Regenerate Edition" }).click();
  await expect(page.locator("#chronicle-task-list")).not.toContainText(
    "Read the morning orders"
  );
});

test("updates planner lists after Done Today and Delete actions", async ({ page }) => {
  const fixture = await openManor(page);
  const originalCount = fixture.data.tasks.length;

  page.once("dialog", dialog => dialog.accept());
  await page
    .locator("#tomorrow-task-list .office-card")
    .filter({ hasText: "Prepare browser smoke review" })
    .getByRole("button", { name: "Done Today" })
    .click();
  await expect(page.locator("#tomorrow-task-list")).not.toContainText(
    "Prepare browser smoke review"
  );
  expect(fixture.data.tasks).toHaveLength(originalCount);
  expect(fixture.data.tasks.find(task => task.id === "task-tomorrow-1").completed).toBe(
    true
  );

  page.once("dialog", dialog => dialog.accept());
  await page
    .locator("#overdue-task-list .office-card")
    .filter({ hasText: "Overdue garden note" })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.locator("#overdue-task-list")).not.toContainText("Overdue garden note");
  expect(fixture.data.tasks).toHaveLength(originalCount - 1);
});

test("keeps planner data visible and controls recover after API failures", async ({ page }) => {
  page.errorMonitor.allowConsoleError(/Failed to load resource:.*500/);

  const fixture = await openManor(page);
  fixture.state.plannerStatus = 500;
  fixture.state.plannerError = "Planner fixture failure.";

  await page.getByRole("button", { name: "Next Day" }).first().click();
  await expect(page.locator("#planner-error")).toContainText("Planner fixture failure.");
  await expect(page.locator("#tomorrow-task-list")).toContainText(
    "Prepare browser smoke review"
  );
  await expect(page.getByRole("button", { name: "Next Day" }).first()).toBeEnabled();

  fixture.state.plannerStatus = null;
  await page.getByRole("button", { name: "Next Day" }).first().click();
  await expect(page.locator("#planner-error")).toBeHidden();
});

test("marks a tomorrow Order done today without a page reload", async ({ page }) => {
  const fixture = await openManor(page);
  const mainFrame = page.mainFrame();
  let navigations = 0;
  const taskRequests = [];

  page.on("framenavigated", frame => {
    if (frame === mainFrame) {
      navigations += 1;
    }
  });

  page.on("request", request => {
    const url = new URL(request.url());

    if (url.pathname === "/api/tasks" && request.method() === "PUT") {
      taskRequests.push(JSON.parse(request.postData() || "{}"));
    }
  });

  const card = page
    .locator("#tomorrow-task-list .office-card")
    .filter({ hasText: "Prepare browser smoke review" });

  page.once("dialog", async dialog => {
    expect(dialog.message()).toContain("will be removed from tomorrow’s plan");
    expect(dialog.message()).toContain("will not appear in tomorrow’s Chronicle");
    await dialog.accept();
  });

  await Promise.all([
    page.waitForResponse(response => {
      const request = response.request();
      const url = new URL(response.url());

      return (
        url.pathname === "/api/tasks" &&
        request.method() === "PUT" &&
        response.status() === 200
      );
    }),
    card.getByRole("button", { name: "Done Today" }).click()
  ]);

  await expect(page.locator("#tomorrow-task-list")).not.toContainText(
    "Prepare browser smoke review"
  );
  await expect(page.locator("#tomorrow-task-list .office-card")).toHaveCount(1);
  expect(taskRequests).toHaveLength(1);
  expect(taskRequests[0]).toMatchObject({
    id: "task-tomorrow-1",
    completed: true
  });
  expect(taskRequests[0]).not.toHaveProperty("completedAt");

  const updated = fixture.data.tasks.find(task => task.id === "task-tomorrow-1");
  expect(updated.completed).toBe(true);
  expect(updated.completedAt).toMatch(/T/);
  expect(navigations).toBe(0);
});

test("keeps a tomorrow Order visible when completing early fails", async ({ page }) => {
  page.errorMonitor.allowConsoleError(/Failed to load resource:.*500/);

  await openManor(page, {
    taskPutStatus: 500,
    taskPutError: "Fixture task update failure."
  });

  const card = page
    .locator("#tomorrow-task-list .office-card")
    .filter({ hasText: "Prepare browser smoke review" });
  const button = card.getByRole("button", { name: "Done Today" });
  const dialogMessages = [];

  page.on("dialog", async dialog => {
    dialogMessages.push(dialog.message());
    await dialog.accept();
  });

  await button.click();
  await expect(card).toBeVisible();
  await expect(button).toBeEnabled();
  expect(dialogMessages.some(message => message.includes("Fixture task update failure."))).toBe(
    true
  );
});

test("shows the active tomorrow empty state after the final Order is done", async ({ page }) => {
  await openManor(page);

  while (await page.locator("#tomorrow-task-list .office-card").count()) {
    const card = page.locator("#tomorrow-task-list .office-card").first();
    page.once("dialog", dialog => dialog.accept());
    await Promise.all([
      page.waitForResponse(response => {
        const request = response.request();
        const url = new URL(response.url());

        return (
          url.pathname === "/api/tasks" &&
          request.method() === "PUT" &&
          response.status() === 200
        );
      }),
      card.getByRole("button", { name: "Done Today" }).click()
    ]);
  }

  await expect(page.locator("#empty-tasks")).toBeVisible();
  await expect(page.locator("#empty-tasks")).toHaveText(
    "No Orders remain for this date."
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
  page.errorMonitor.allowConsoleError(/Failed to load resource:.*404/);

  await openManor(page, { noTodayEdition: true });

  await expect(page.locator("#chronicle-headline")).not.toHaveText(
    "Opening the Morning Dispatch..."
  );
  await expect(page.locator("#chronicle-headline")).toHaveText(
    "1 Order Awaits Attention"
  );
  await expect(page.locator("#chronicle-lead")).toHaveText(
    "Today's dispatch contains 1 order, 1 recorded affair, and 2 milestones overdue or due within the next seven days."
  );
  await expect(page.locator("#chronicle-task-list")).toContainText("Read the morning orders");
  await expect(page.locator("#chronicle-task-list")).not.toContainText("File the completed order");
  await expect(page.locator("#chronicle-task-list")).not.toContainText("Pending");
  await expect(page.locator("#chronicle-task-list")).not.toContainText("Completed");
  await expect(page.locator("#chronicle-lead")).not.toContainText("pending");
  await expect(page.locator("#chronicle-lead")).not.toContainText("completed");
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

  await expect(page.locator("#chronicle-edition-status")).toHaveText(
    "Unsealed Reconstruction"
  );
  await expect(page.getByRole("button", { name: "Seal Edition" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Regenerate Edition" })).toBeDisabled();

  await page.getByRole("button", { name: "Refresh Preview" }).click();
  await expect(page.getByRole("button", { name: "Refresh Preview" })).toBeEnabled();
});

test("uses one unified Chronicle request for a manual refresh", async ({ page }) => {
  page.errorMonitor.allowConsoleError(/Failed to load resource:.*404/);

  await openManor(page, { noTodayEdition: true });
  await expect(page.getByRole("button", { name: "Refresh Preview" })).toBeEnabled();
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
    page.getByRole("button", { name: "Refresh Preview" }).click()
  ]);

  await expect(page.getByRole("button", { name: "Refresh Preview" })).toBeEnabled();
  await page.waitForTimeout(50);

  expect(chronicleRequests).toHaveLength(1);
  expect(chronicleRequests[0].searchParams.get("date")).toMatch(
    /^\d{4}-\d{2}-\d{2}$/
  );
});

test("shows a readable Chronicle error state", async ({ page }) => {
  page.errorMonitor.allowConsoleError(
    /Failed to load resource:.*404/
  );
  page.errorMonitor.allowConsoleError(
    /Failed to load resource:.*500/
  );

  await installMockApi(page, {
    authenticated: true,
    noTodayEdition: true,
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
  await expect(page.getByRole("button", { name: "Refresh Preview" })).toBeEnabled();
});

test("renders quiet Chronicle empty states", async ({ page }) => {
  page.errorMonitor.allowConsoleError(/Failed to load resource:.*404/);

  const response = emptyChronicleResponse(
    new Date().toISOString().slice(0, 10)
  );

  await installMockApi(page, {
    authenticated: true,
    noTodayEdition: true,
    chronicleResponse: response
  });

  await page.goto("/");
  await expect(page.locator("#manor-application")).toBeVisible();
  await expect(page.locator("#chronicle-headline")).toHaveText(
    "A Quiet Morning Across the Manor"
  );
  await expect(page.locator("#chronicle-task-list")).toContainText(
    "No Orders remain for today."
  );
  await expect(page.locator("#chronicle-issue-list")).toContainText(
    "No affairs have yet been entered today."
  );
  await expect(page.locator("#chronicle-milestone-list")).toContainText(
    "No overdue or near-term milestones require attention."
  );
});

test("loads sealed Chronicle editions before live records", async ({ page }) => {
  const fixture = await openManor(page);

  await expect(page.locator("#chronicle-edition-status")).toHaveText("Sealed Edition");
  await expect(page.locator("#chronicle-headline")).toHaveText("Sealed Fixture Edition");
  await expect(page.locator("#chronicle-lead")).toHaveText(
    "This sealed fixture edition is stored as a permanent snapshot."
  );
  await expect(page.locator("#chronicle-task-list")).toContainText("Read the morning orders");
  await expect(page.locator("#chronicle-issue-list")).toContainText("Smoke test fixture issue");
  await expect(page.locator("#chronicle-milestone-list")).toContainText(
    "Overdue smoke milestone"
  );
  await expect(page.locator("#chronicle-edition-select")).toContainText(
    "Sealed Fixture Edition"
  );
  await expect(page.locator("#chronicle-edition-select")).toHaveValue(fixture.today);
  await expect(page.getByRole("button", { name: "Seal Edition" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Regenerate Edition" })).toBeEnabled();
});

test("seals a live Chronicle preview without a page reload", async ({ page }) => {
  page.errorMonitor.allowConsoleError(/Failed to load resource:.*404/);

  const fixture = await openManor(page, { noTodayEdition: true });
  const mainFrame = page.mainFrame();
  let navigations = 0;
  const postedBodies = [];

  page.on("framenavigated", frame => {
    if (frame === mainFrame) {
      navigations += 1;
    }
  });

  page.on("request", request => {
    const url = new URL(request.url());

    if (
      url.pathname === "/api/chronicle-editions" &&
      request.method() === "POST"
    ) {
      postedBodies.push(JSON.parse(request.postData() || "{}"));
    }
  });

  await expect(page.locator("#chronicle-edition-status")).toHaveText(
    "Unsealed Reconstruction"
  );

  await Promise.all([
    page.waitForResponse(response => {
      const request = response.request();
      const url = new URL(response.url());

      return (
        url.pathname === "/api/chronicle-editions" &&
        request.method() === "POST" &&
        response.status() === 201
      );
    }),
    page.getByRole("button", { name: "Seal Edition" }).click()
  ]);

  await expect(page.locator("#chronicle-edition-status")).toHaveText("Sealed Edition");
  await expect(page.locator("#chronicle-edition-select")).toContainText(
    "1 Order Awaits Attention"
  );
  await expect(page.locator("#chronicle-edition-select")).toHaveValue(fixture.today);
  expect(fixture.state.editions.get(fixture.today).orders).toHaveLength(1);
  expect(
    fixture.state.editions.get(fixture.today).orders.map(order => order.title)
  ).not.toContain("File the completed order");
  expect(postedBodies).toEqual([{ date: fixture.today }]);
  expect(navigations).toBe(0);
});

test("shows duplicate seal conflicts without getting stuck", async ({ page }) => {
  page.errorMonitor.allowConsoleError(/Failed to load resource:.*404/);
  page.errorMonitor.allowConsoleError(/Failed to load resource:.*409/);

  await openManor(page, {
    noTodayEdition: true,
    sealConflict: true
  });

  await expect(page.locator("#chronicle-edition-status")).toHaveText(
    "Unsealed Reconstruction"
  );
  await Promise.all([
    page.waitForResponse(response => {
      const request = response.request();
      const url = new URL(response.url());

      return (
        url.pathname === "/api/chronicle-editions" &&
        request.method() === "POST" &&
        response.status() === 409
      );
    }),
    page.getByRole("button", { name: "Seal Edition" }).click()
  ]);

  await expect(page.locator("#chronicle-edition-error")).toContainText(
    "already been sealed"
  );
  await expect(page.getByRole("button", { name: "Seal Edition" })).toBeEnabled();
});

test("keeps sealed editions immutable until regeneration", async ({ page }) => {
  const fixture = await openManor(page);

  await expect(page.locator("#chronicle-headline")).toHaveText("Sealed Fixture Edition");
  await expect(page.locator("#chronicle-issue-list")).toContainText("Smoke test fixture issue");

  fixture.data.issues[0].title = "Changed live issue";
  fixture.data.issues[0].description = "Changed after the edition was sealed.";

  await page.locator("#chronicle-previous-day").click();
  await expect(page.locator("#chronicle-headline")).toHaveText("Previous Sealed Edition");
  await page.locator("#chronicle-next-day").click();
  await expect(page.locator("#chronicle-headline")).toHaveText("Sealed Fixture Edition");
  await expect(page.locator("#chronicle-issue-list")).toContainText("Smoke test fixture issue");
  await expect(page.locator("#chronicle-issue-list")).not.toContainText("Changed live issue");

  const detailBefore = await page.locator("#chronicle-edition-detail").textContent();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Regenerate Edition" }).click();

  await expect(page.locator("#chronicle-issue-list")).toContainText("Changed live issue");
  await expect(page.locator("#chronicle-edition-detail")).toContainText("Last regenerated:");
  const detailAfter = await page.locator("#chronicle-edition-detail").textContent();
  expect(detailAfter).not.toBe(detailBefore);
});

test("regenerates a version-2 edition with active-only Orders and preserved sealing time", async ({ page }) => {
  const fixture = await openManor(page);
  const editionBefore = fixture.state.editions.get(fixture.today);
  const sealedAtBefore = editionBefore.sealedAt;
  const updatedAtBefore = editionBefore.updatedAt;

  fixture.data.tasks = fixture.data.tasks.map(task =>
    task.id === "task-today-1"
      ? {
          ...task,
          completed: true,
          completedAt: `${fixture.today}T11:00:00.000Z`,
          updatedAt: `${fixture.today}T11:00:00.000Z`
        }
      : task
  );

  await page.locator("#chronicle-previous-day").click();
  await page.locator("#chronicle-next-day").click();
  await expect(page.locator("#chronicle-task-list")).toContainText(
    "Read the morning orders"
  );

  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Regenerate Edition" }).click();

  const editionAfter = fixture.state.editions.get(fixture.today);
  expect(editionAfter.formatVersion).toBe(2);
  expect(editionAfter.sealedAt).toBe(sealedAtBefore);
  expect(editionAfter.updatedAt).not.toBe(updatedAtBefore);
  expect(editionAfter.orders).toHaveLength(0);
  await expect(page.locator("#chronicle-task-list")).not.toContainText(
    "Read the morning orders"
  );
  await expect(page.locator("#chronicle-task-list")).toContainText(
    "No Orders remain for today."
  );
});

test("keeps legacy version-1 edition statuses readable and upgrades on regeneration", async ({ page }) => {
  const fixture = await openManor(page);

  await page.locator("#chronicle-previous-day").click();
  await expect(page.locator("#chronicle-headline")).toHaveText("Previous Sealed Edition");
  await expect(page.locator("#chronicle-task-list")).toContainText("Archived pending order");
  await expect(page.locator("#chronicle-task-list")).toContainText("Archived completed order");
  await expect(page.locator("#chronicle-task-list")).toContainText("Pending");
  await expect(page.locator("#chronicle-task-list")).toContainText("Completed");

  const previousDate = addDays(fixture.today, -1);
  const sealedAtBefore = fixture.state.editions.get(previousDate).sealedAt;

  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Regenerate Edition" }).click();

  const regenerated = fixture.state.editions.get(previousDate);
  expect(regenerated.formatVersion).toBe(2);
  expect(regenerated.sealedAt).toBe(sealedAtBefore);
  await expect(page.locator("#chronicle-task-list")).not.toContainText("Pending");
  await expect(page.locator("#chronicle-task-list")).not.toContainText("Completed");
});

test("navigates dated Chronicle editions and blocks future dates", async ({ page }) => {
  const fixture = await openManor(page);
  const previousDate = addDays(fixture.today, -1);
  const futureDate = addDays(fixture.today, 1);
  const chronicleRequests = [];

  page.on("request", request => {
    const url = new URL(request.url());

    if (url.pathname === "/api/chronicle") {
      chronicleRequests.push(url.searchParams.get("date"));
    }
  });

  await page.locator("#chronicle-previous-day").click();
  await expect(page.locator("#chronicle-edition-status")).toHaveText("Sealed Edition");
  await expect(page.locator("#chronicle-headline")).toHaveText("Previous Sealed Edition");
  await expect(page.locator("#chronicle-orders-heading")).toHaveText("Orders of the Day");
  await expect(page.locator("#chronicle-record-heading")).toHaveText("Record of the Day");
  await expect(page.locator("#chronicle-task-list")).toContainText("Archived pending order");
  await expect(page.locator("#chronicle-next-day")).toBeEnabled();

  await page.locator("#chronicle-next-day").click();
  await expect(page.locator("#chronicle-edition-select")).toHaveValue(fixture.today);
  await expect(page.locator("#chronicle-next-day")).toBeDisabled();

  await page.locator("#chronicle-date-input").evaluate((input, value) => {
    input.value = value;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, previousDate);
  await expect(page.locator("#chronicle-headline")).toHaveText("Previous Sealed Edition");

  await page.locator("#chronicle-date-input").evaluate((input, value) => {
    input.value = value;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, futureDate);
  await expect(page.locator("#chronicle-edition-error")).toContainText(
    "Choose today or an earlier valid date."
  );
  expect(chronicleRequests).not.toContain(futureDate);
});

test("renders an empty Chronicle archive while live previews still work", async ({ page }) => {
  page.errorMonitor.allowConsoleError(/Failed to load resource:.*404/);

  await openManor(page, {
    emptyEditions: true,
    noTodayEdition: true
  });

  await expect(page.locator("#chronicle-edition-status")).toHaveText(
    "Unsealed Reconstruction"
  );
  await expect(page.locator("#chronicle-archive-empty")).toHaveText(
    "No editions have been sealed yet."
  );
  await expect(page.locator("#chronicle-edition-select")).toBeDisabled();
  await expect(page.locator("#chronicle-headline")).toHaveText(
    "1 Order Awaits Attention"
  );
});

test("falls back to live Chronicle previews when edition storage is unavailable", async ({ page }) => {
  page.errorMonitor.allowConsoleError(/Failed to load resource:.*503/);

  await openManor(page, { editionStorageUnavailable: true });

  await expect(page.locator("#chronicle-edition-status")).toHaveText(
    "Permanent Storage Unavailable"
  );
  await expect(page.locator("#chronicle-headline")).toHaveText(
    "1 Order Awaits Attention"
  );
  await expect(page.getByRole("button", { name: "Seal Edition" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Regenerate Edition" })).toBeDisabled();
  await expect(page.locator("#chronicle-archive-empty")).toHaveText(
    "Permanent edition storage is unavailable."
  );
});

test("surfaces Chronicle edition API failures and keeps controls recoverable", async ({ page }) => {
  page.errorMonitor.allowConsoleError(/Failed to load resource:.*500/);

  const fixture = await openManor(page, {
    editionStatus: 500,
    editionError: "Edition fixture failure."
  });

  await expect(page.locator("#chronicle-headline")).toHaveText(
    "The Morning Dispatch Could Not Be Opened"
  );
  await expect(page.locator("#chronicle-edition-error")).toHaveText(
    "Edition fixture failure."
  );
  await expect(page.locator("#chronicle-previous-day")).toBeEnabled();

  fixture.state.editionStatus = null;
  await page.locator("#chronicle-previous-day").click();
  await expect(page.locator("#chronicle-headline")).toHaveText("Previous Sealed Edition");
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
