const LEGACY_STORAGE_KEY =
  "lord-manor-issues-v1";

const MIGRATION_STORAGE_KEY =
  "lord-manor-d1-migration-v1";

const departments =
  window.MANOR_DEPARTMENTS ?? [];

const departmentMap =
  window.MANOR_DEPARTMENT_MAP ?? {};

const legacyDepartmentMap =
  window.MANOR_LEGACY_DEPARTMENT_MAP ?? {};

const regionNames = Object.fromEntries(
  departments.map(
    department => [
      department.id,
      department.name
    ]
  )
);

const projectStatusNames = {
  proposed: "Proposed",
  active: "Active",
  suspended: "Suspended",
  completed: "Completed"
};

const projectStatusOrder = [
  "active",
  "proposed",
  "suspended",
  "completed"
];

const dateElement =
  document.querySelector("#current-date");

const loginScreen =
  document.querySelector("#login-screen");

const loginForm =
  document.querySelector("#login-form");

const loginPasswordInput =
  document.querySelector("#login-password");

const loginError =
  document.querySelector("#login-error");

const loginButton =
  document.querySelector("#login-button");

const logoutButton =
  document.querySelector("#logout-button");

const manorApplication =
  document.querySelector("#manor-application");

const recordButton =
  document.querySelector("#record-button");

const issueDialog =
  document.querySelector("#issue-dialog");

const issueForm =
  document.querySelector("#issue-form");

const issueDialogTitle =
  document.querySelector(
    "#issue-dialog-title"
  );

const saveIssueButton =
  document.querySelector(
    "#save-issue-button"
  );

const closeDialogButton =
  document.querySelector("#close-dialog");

const cancelIssueButton =
  document.querySelector("#cancel-issue");

const issueDateInput =
  document.querySelector("#issue-date");

const issueRegionInput =
  document.querySelector("#issue-region");

const issueProjectInput =
  document.querySelector("#issue-project");

const issueTitleInput =
  document.querySelector("#issue-title");

const issueDescriptionInput =
  document.querySelector("#issue-description");

const issueDurationInput =
  document.querySelector("#issue-duration");

const issueList =
  document.querySelector("#issue-list");

const emptyIssues =
  document.querySelector("#empty-issues");

const newProjectButton =
  document.querySelector("#new-project-button");

const projectDialog =
  document.querySelector("#project-dialog");

const projectForm =
  document.querySelector("#project-form");

const projectDialogTitle =
  document.querySelector("#project-dialog-title");

const closeProjectDialogButton =
  document.querySelector("#close-project-dialog");

const cancelProjectButton =
  document.querySelector("#cancel-project");

const saveProjectButton =
  document.querySelector("#save-project-button");

const projectNameInput =
  document.querySelector("#project-name");

const projectRegionInput =
  document.querySelector("#project-region");

const projectObjectiveInput =
  document.querySelector("#project-objective");

const projectStatusInput =
  document.querySelector("#project-status");

const projectProgressInput =
  document.querySelector("#project-progress");

const projectStartDateInput =
  document.querySelector("#project-start-date");

const projectTargetDateInput =
  document.querySelector("#project-target-date");

const projectNextActionInput =
  document.querySelector("#project-next-action");

const projectNotesInput =
  document.querySelector("#project-notes");

const projectBoard =
  document.querySelector("#project-board");

const emptyProjects =
  document.querySelector("#empty-projects");

const manorHome =
  document.querySelector("#manor-home");

const departmentGrid =
  document.querySelector("#department-grid");

const departmentPage =
  document.querySelector("#department-page");

const departmentBackButton =
  document.querySelector(
    "#department-back-button"
  );

const departmentPageIcon =
  document.querySelector(
    "#department-page-icon"
  );

const departmentPageName =
  document.querySelector(
    "#department-page-name"
  );

const departmentPageFocus =
  document.querySelector(
    "#department-page-focus"
  );

const departmentPageMandate =
  document.querySelector(
    "#department-page-mandate"
  );

const departmentFinanceNote =
  document.querySelector(
    "#department-finance-note"
  );

const departmentActivityCount =
  document.querySelector(
    "#department-activity-count"
  );

const departmentTimeTotal =
  document.querySelector(
    "#department-time-total"
  );

const departmentProjectCount =
  document.querySelector(
    "#department-project-count"
  );

const departmentActivityList =
  document.querySelector(
    "#department-activity-list"
  );

const departmentProjectList =
  document.querySelector(
    "#department-project-list"
  );

const departmentEmptyActivities =
  document.querySelector(
    "#department-empty-activities"
  );

const departmentEmptyProjects =
  document.querySelector(
    "#department-empty-projects"
  );

const departmentPageTypes =
  window.MANOR_DEPARTMENT_PAGE_TYPES ?? {};

const manorSettings =
  window.MANOR_SETTINGS ?? {
    currencyCode: "USD",
    locale: "en-US"
  };

const manorCurrencyCode =
  manorSettings.currencyCode;

const manorLocale =
  manorSettings.locale;

const recentIssueList =
  document.querySelector("#recent-issue-list");

const emptyRecentIssues =
  document.querySelector("#empty-recent-issues");

const operationalDepartmentView =
  document.querySelector(
    "#operational-department-view"
  );

const councilDepartmentView =
  document.querySelector(
    "#council-department-view"
  );

const chronicleDepartmentView =
  document.querySelector(
    "#chronicle-department-view"
  );

const treasuryDepartmentView =
  document.querySelector(
    "#treasury-department-view"
  );

const departmentCurrentList =
  document.querySelector(
    "#department-current-list"
  );

const departmentHistoryList =
  document.querySelector(
    "#department-history-list"
  );

const departmentEmptyCurrent =
  document.querySelector(
    "#department-empty-current"
  );

const departmentEmptyHistory =
  document.querySelector(
    "#department-empty-history"
  );

const issueMoneyInput =
  document.querySelector("#issue-money");

const issueMoneyLabel =
  document.querySelector("#issue-money-label");

issueMoneyLabel.textContent =
  `Money cost (${manorCurrencyCode})`;

let issues = [];
let projects = [];

let editingIssueId = null;
let editingProjectId = null;

const today = new Intl.DateTimeFormat(
  "en-US",
  {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }
).format(new Date());

dateElement.textContent = today;

function getLocalDateString() {
  const now = new Date();
  const timezoneOffset =
    now.getTimezoneOffset() * 60_000;

  return new Date(
    now.getTime() - timezoneOffset
  )
    .toISOString()
    .slice(0, 10);
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(
    options.headers || {}
  );

  if (
    options.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin"
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401) {
    showLoginScreen();

    throw new Error(
      payload?.error ||
      "Your session has expired."
    );
  }

  if (!response.ok) {
    throw new Error(
      payload?.error ||
      `The server returned status ${response.status}.`
    );
  }

  return payload;
}

function showLoginScreen() {
  manorApplication.hidden = true;
  loginScreen.hidden = false;
  loginPasswordInput.focus();
}

function showManor() {
  loginScreen.hidden = true;
  manorApplication.hidden = false;
  routeManorView();
}

async function checkSession() {
  const response = await fetch(
    "/api/auth/session",
    {
      credentials: "same-origin",
      cache: "no-store"
    }
  );

  if (!response.ok) {
    return false;
  }

  const payload = await response.json();

  return payload.authenticated === true;
}

function formatDate(dateString) {
  if (!dateString) {
    return null;
  }

  const date = new Date(
    `${dateString}T12:00:00`
  );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  ).format(date);
}

function formatMoneyFromCents(value) {
  const cents = Number(value) || 0;

  return new Intl.NumberFormat(
    manorLocale,
    {
      style: "currency",
      currency: manorCurrencyCode
    }
  ).format(cents / 100);
}

function parseMoneyToCents(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const amount = Number(value);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new Error(
      "The money cost must be a valid non-negative amount."
    );
  }

  return Math.round(
    (amount + Number.EPSILON) * 100
  );
}

function createTextElement(
  tag,
  className,
  text
) {
  const element =
    document.createElement(tag);

  if (className) {
    element.className = className;
  }

  element.textContent = text;

  return element;
}

function populateDepartmentSelect(select) {
  const previousValue = select.value;

  select.replaceChildren();

  for (const department of departments) {
    const option =
      document.createElement("option");

    option.value = department.id;
    option.textContent = department.name;

    select.append(option);
  }

  if (
    [...select.options].some(
      option =>
        option.value === previousValue
    )
  ) {
    select.value = previousValue;
  }
}

function renderDepartmentCards() {
  departmentGrid.replaceChildren();

  for (const department of departments) {
    const card =
      document.createElement("a");

    card.className =
      "region-card department-card";

    card.href =
      `#department/${department.id}`;

    const icon =
      createTextElement(
        "span",
        "icon",
        department.icon
      );

    const name =
      createTextElement(
        "h3",
        "",
        department.name
      );

    const focus =
      createTextElement(
        "p",
        "",
        department.focus
      );

    card.append(icon, name, focus);
    departmentGrid.append(card);
  }
}

function getDepartmentIdFromHash() {
  const prefix = "#department/";

  if (!location.hash.startsWith(prefix)) {
    return null;
  }

  try {
    return decodeURIComponent(
      location.hash.slice(prefix.length)
    );
  } catch {
    return null;
  }
}

function createDepartmentIssueCard(issue) {
  const card = document.createElement("article");

  card.className = "department-record-card";

  const metaParts = [
    formatDate(issue.date)
  ];

  if (
    issue.duration !== null &&
    issue.duration !== undefined
  ) {
    metaParts.push(
      `${issue.duration} minutes`
    );
  }

  if (
    Number(issue.moneyCostCents) > 0
  ) {
    metaParts.push(
      formatMoneyFromCents(
        issue.moneyCostCents
      )
    );
  }

  const meta = createTextElement(
    "p",
    "department-record-meta",
    metaParts.join(" · ")
  );

  const title = createTextElement(
    "h3",
    "",
    issue.title
  );

  card.append(meta, title);

  if (issue.description) {
    const description = createTextElement(
      "p",
      "department-record-description",
      issue.description
    );

    card.append(description);
  }

  const project = getProjectById(
    issue.projectId
  );

  const projectName =
    project?.name ||
    issue.projectName ||
    null;

  if (projectName) {
    const projectElement = createTextElement(
      "p",
      "department-record-project",
      `Project: ${projectName}`
    );

    card.append(projectElement);
  }
  const actions =
    document.createElement("div");
  
  actions.className =
    "issue-card-actions";
  
  const editButton =
    createTextElement(
      "button",
      "edit-issue-button",
      "Edit"
    );
  
  editButton.type = "button";
  
  editButton.addEventListener(
    "click",
    () => {
      openIssueDialog(issue);
    }
  );
  
  actions.append(editButton);
  card.append(actions);
  return card;
}

function projectStartSortValue(project) {
  return (
    project.startDate ||
    project.createdAt ||
    ""
  );
}

function projectCompletionSortValue(project) {
  return (
    project.completedAt ||
    project.updatedAt ||
    ""
  );
}

function renderOperationalDepartment(
  department
) {
  const departmentIssues =
    issues
      .filter(
        issue =>
          issue.region === department.id
      )
      .sort((first, second) => {
        const firstValue =
          `${first.date}-${first.createdAt ?? ""}`;

        const secondValue =
          `${second.date}-${second.createdAt ?? ""}`;

        return secondValue.localeCompare(
          firstValue
        );
      });

  const departmentProjects =
    projects.filter(
      project =>
        project.region === department.id
    );

  const currentProjects =
    departmentProjects
      .filter(
        project =>
          project.status !== "completed"
      )
      .sort((first, second) =>
        projectStartSortValue(
          second
        ).localeCompare(
          projectStartSortValue(first)
        )
      );

  const completedProjects =
    departmentProjects
      .filter(
        project =>
          project.status === "completed"
      )
      .sort((first, second) =>
        projectCompletionSortValue(
          second
        ).localeCompare(
          projectCompletionSortValue(
            first
          )
        )
      );

  const totalMinutes =
    departmentIssues.reduce(
      (sum, issue) =>
        sum +
        (Number(issue.duration) || 0),
      0
    );

  departmentActivityCount.textContent =
    String(departmentIssues.length);

  departmentTimeTotal.textContent =
    String(totalMinutes);

  departmentProjectCount.textContent =
    String(currentProjects.length);

  departmentCurrentList.replaceChildren();

  departmentEmptyCurrent.hidden =
    currentProjects.length > 0;

  for (const project of currentProjects) {
    departmentCurrentList.append(
      createProjectCard(project)
    );
  }

  departmentHistoryList.replaceChildren();

  const hasHistory =
    completedProjects.length > 0 ||
    departmentIssues.length > 0;

  departmentEmptyHistory.hidden =
    hasHistory;

  /*
   * Completed projects deliberately appear
   * before recorded issues.
   */
  for (
    const project
    of completedProjects
  ) {
    departmentHistoryList.append(
      createProjectCard(project)
    );
  }

  for (const issue of departmentIssues) {
    departmentHistoryList.append(
      createDepartmentIssueCard(issue)
    );
  }
}

function renderDepartmentPage() {
  const departmentId =
    getDepartmentIdFromHash();

  const department =
    departmentMap[departmentId];

  if (!department) {
    manorHome.hidden = false;
    departmentPage.hidden = true;
    return;
  }

  manorHome.hidden = true;
  departmentPage.hidden = false;

  operationalDepartmentView.hidden = true;
  councilDepartmentView.hidden = true;
  chronicleDepartmentView.hidden = true;
  treasuryDepartmentView.hidden = true;

  departmentPageIcon.textContent =
    department.icon;

  departmentPageName.textContent =
    department.name;

  departmentPageFocus.textContent =
    department.focus;

  departmentPageMandate.textContent =
    department.mandate;

  departmentFinanceNote.textContent =
    department.financeTracked
      ? (
          "This department is included in Treasury " +
          "money and time accounting."
        )
      : (
          "This department is excluded from Treasury " +
          "departmental accounting."
        );

  const pageType =
    departmentPageTypes[
      department.id
    ] || "operational";

  if (pageType === "operational") {
    operationalDepartmentView.hidden =
      false;

    renderOperationalDepartment(
      department
    );
  }

  if (pageType === "council") {
    councilDepartmentView.hidden =
      false;
  }

  if (pageType === "chronicle") {
    chronicleDepartmentView.hidden =
      false;
  }

  if (pageType === "treasury") {
    treasuryDepartmentView.hidden =
      false;
  
    window.ManorTreasury.render(
      issues
    );
  }

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}

function routeManorView() {
  if (getDepartmentIdFromHash()) {
    renderDepartmentPage();
  } else {
    manorHome.hidden = false;
    departmentPage.hidden = true;
  }
}

function refreshOpenDepartmentPage() {
  if (getDepartmentIdFromHash()) {
    renderDepartmentPage();
  }
}

function getProjectById(projectId) {
  return projects.find(
    project => project.id === projectId
  ) || null;
}

function updateIssueProjectOptions() {
  const selectedValue =
    issueProjectInput.value;

  issueProjectInput.replaceChildren();

  const noProjectOption =
    document.createElement("option");

  noProjectOption.value = "";
  noProjectOption.textContent =
    "No related project";

  issueProjectInput.append(noProjectOption);

  const sortedProjects = [...projects].sort(
    (first, second) => {
      const firstOrder =
        projectStatusOrder.indexOf(
          first.status
        );

      const secondOrder =
        projectStatusOrder.indexOf(
          second.status
        );

      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }

      return first.name.localeCompare(
        second.name
      );
    }
  );

  for (const project of sortedProjects) {
    const option =
      document.createElement("option");

    option.value = project.id;
    option.textContent =
      `${project.name} ` +
      `(${projectStatusNames[project.status]})`;

    issueProjectInput.append(option);
  }

  if (
    [...issueProjectInput.options].some(
      option =>
        option.value === selectedValue
    )
  ) {
    issueProjectInput.value =
      selectedValue;
  }
}

function createIssueCard(issue) {
  const card =
    document.createElement("article");

  card.className = "issue-card";

  const header =
    document.createElement("div");

  header.className =
    "issue-card-header";

  const headingContainer =
    document.createElement("div");

  const metaParts = [
    regionNames[issue.region] ??
      issue.region ??
      "Unknown Department",

    formatDate(issue.date)
  ];

  if (
    issue.duration !== null &&
    issue.duration !== undefined
  ) {
    metaParts.push(
      `${issue.duration} minutes`
    );
  }

  if (
    Number(issue.moneyCostCents) > 0
  ) {
    metaParts.push(
      formatMoneyFromCents(
        issue.moneyCostCents
      )
    );
  }

  const meta = createTextElement(
    "p",
    "issue-meta",
    metaParts.join(" · ")
  );

  const title = createTextElement(
    "h3",
    "",
    issue.title
  );

  headingContainer.append(meta, title);

  const project =
    getProjectById(issue.projectId);

  const projectName =
    project?.name ||
    issue.projectName ||
    null;

  if (projectName) {
    headingContainer.append(
      createTextElement(
        "p",
        "issue-project",
        `Project: ${projectName}`
      )
    );
  }

  const editButton =
    createTextElement(
      "button",
      "edit-issue-button",
      "Edit"
    );
  
  editButton.type = "button";
  
  editButton.addEventListener(
    "click",
    () => {
      openIssueDialog(issue);
    }
  );

  const deleteButton =
    createTextElement(
      "button",
      "delete-button",
      "Delete"
    );

  deleteButton.type = "button";

  deleteButton.addEventListener(
    "click",
    async () => {
      const confirmed =
        window.confirm(
          `Delete the issue “${issue.title}”?`
        );

      if (!confirmed) {
        return;
      }

      deleteButton.disabled = true;
      deleteButton.textContent =
        "Deleting...";

      try {
        await apiFetch(
          `/api/issues?id=${
            encodeURIComponent(issue.id)
          }`,
          {
            method: "DELETE"
          }
        );

        issues = issues.filter(
          item => item.id !== issue.id
        );

        renderIssues();
      } catch (error) {
        window.alert(error.message);
        deleteButton.disabled = false;
        deleteButton.textContent =
          "Delete";
      }
    }
  );

  const actions =
    document.createElement("div");
  
  actions.className =
    "issue-card-actions";
  
  actions.append(
    editButton,
    deleteButton
  );
  
  header.append(
    headingContainer,
    actions
  );

  card.append(header);

  if (issue.description) {
    card.append(
      createTextElement(
        "p",
        "issue-description",
        issue.description
      )
    );
  }

  return card;
}

function renderIssues() {
  const sortedIssues = [...issues].sort(
    (first, second) => {
      const firstValue =
        `${first.date}-${first.createdAt ?? ""}`;

      const secondValue =
        `${second.date}-${second.createdAt ?? ""}`;

      return secondValue.localeCompare(
        firstValue
      );
    }
  );

  issueList.replaceChildren();
  recentIssueList.replaceChildren();

  emptyIssues.hidden =
    sortedIssues.length > 0;

  const recentIssues =
    sortedIssues.slice(0, 3);

  emptyRecentIssues.hidden =
    recentIssues.length > 0;

  for (const issue of sortedIssues) {
    issueList.append(
      createIssueCard(issue)
    );
  }

  for (const issue of recentIssues) {
    recentIssueList.append(
      createIssueCard(issue)
    );
  }

  queueMicrotask(
    refreshOpenDepartmentPage
  );
}

async function refreshIssues() {
  emptyIssues.hidden = false;
  emptyIssues.textContent =
    "Opening the Chronicle Archive...";

  const payload = await apiFetch(
    "/api/issues"
  );

  issues = payload.issues ?? [];
  renderIssues();
}

function createProjectCard(project) {
  const card =
    document.createElement("article");

  card.className = "project-card";

  const header =
    document.createElement("div");

  header.className =
    "project-card-header";

  const headingContainer =
    document.createElement("div");

  const region = createTextElement(
    "p",
    "project-region",
    regionNames[project.region] ??
    project.region ??
    "Unknown Department"
  );

  const name = createTextElement(
    "h4",
    "",
    project.name
  );

  headingContainer.append(region, name);

  const status = createTextElement(
    "span",
    "project-status",
    projectStatusNames[project.status]
  );

  header.append(
    headingContainer,
    status
  );

  card.append(header);

  if (project.objective) {
    const objective = createTextElement(
      "p",
      "project-objective",
      project.objective
    );

    card.append(objective);
  }

  const dates = [];

  if (project.startDate) {
    dates.push(
      `Started ${formatDate(
        project.startDate
      )}`
    );
  }
  
  if (project.targetDate) {
    dates.push(
      `Target ${formatDate(
        project.targetDate
      )}`
    );
  }
  
  if (project.completedAt) {
    const completedDate =
      new Date(project.completedAt);
  
    dates.push(
      `Completed ${new Intl.DateTimeFormat(
        manorLocale,
        {
          year: "numeric",
          month: "short",
          day: "numeric"
        }
      ).format(completedDate)}`
    );
  }
  
  if (dates.length > 0) {
    card.append(
      createTextElement(
        "p",
        "project-dates",
        dates.join(" · ")
      )
    );
  }

  const progressHeading =
    document.createElement("div");

  progressHeading.className =
    "project-progress-heading";

  progressHeading.append(
    createTextElement(
      "span",
      "",
      "Progress"
    ),
    createTextElement(
      "span",
      "",
      `${project.progress}%`
    )
  );

  const progressTrack =
    document.createElement("div");

  progressTrack.className =
    "project-progress-track";

  const progressFill =
    document.createElement("div");

  progressFill.className =
    "project-progress-fill";

  progressFill.style.width =
    `${project.progress}%`;

  progressTrack.append(progressFill);

  card.append(
    progressHeading,
    progressTrack
  );

  if (project.nextAction) {
    const nextAction =
      document.createElement("div");

    nextAction.className =
      "project-next-action";

    const heading =
      document.createElement("strong");

    heading.textContent = "Next action";

    const content =
      document.createElement("span");

    content.textContent =
      project.nextAction;

    nextAction.append(
      heading,
      content
    );

    card.append(nextAction);
  }

  const actions =
    document.createElement("div");

  actions.className =
    "project-actions";

  const editButton =
    createTextElement(
      "button",
      "edit-project-button",
      "Edit"
    );

  editButton.type = "button";

  editButton.addEventListener(
    "click",
    () => {
      openProjectDialog(project);
    }
  );

  const deleteButton =
    createTextElement(
      "button",
      "delete-project-button",
      "Delete"
    );

  deleteButton.type = "button";

  deleteButton.addEventListener(
    "click",
    async () => {
      const confirmed =
        window.confirm(
          `Delete the project “${project.name}”? ` +
          "Its activities will remain in the archive."
        );

      if (!confirmed) {
        return;
      }

      deleteButton.disabled = true;
      deleteButton.textContent =
        "Deleting...";

      try {
        await apiFetch(
          `/api/projects?id=${
            encodeURIComponent(project.id)
          }`,
          {
            method: "DELETE"
          }
        );

        projects = projects.filter(
          item => item.id !== project.id
        );

        issues = issues.map(issue => {
          if (
            issue.projectId === project.id
          ) {
            return {
              ...issue,
              projectId: null,
              projectName: null
            };
          }

          return issue;
        });

        renderProjects();
        renderIssues();
        updateIssueProjectOptions();
        
        if (window.refreshEstateOffice) {
          window.refreshEstateOffice().catch(
            console.error
          );
        }
      } catch (error) {
        window.alert(error.message);
        deleteButton.disabled = false;
        deleteButton.textContent =
          "Delete";
      }
    }
  );

  actions.append(
    editButton,
    deleteButton
  );

  card.append(actions);

  return card;
}

function renderProjects() {
  queueMicrotask(
    refreshOpenDepartmentPage
  );
  projectBoard.replaceChildren();

  if (projects.length === 0) {
    emptyProjects.hidden = false;
    projectBoard.hidden = true;
    return;
  }

  emptyProjects.hidden = true;
  projectBoard.hidden = false;

  for (
    const projectStatus
    of projectStatusOrder
  ) {
    const statusProjects =
      projects
        .filter(
          project =>
            project.status ===
            projectStatus
        )
        .sort((first, second) => {
          if (
            first.targetDate &&
            second.targetDate
          ) {
            return first.targetDate
              .localeCompare(
                second.targetDate
              );
          }

          if (first.targetDate) {
            return -1;
          }

          if (second.targetDate) {
            return 1;
          }

          return second.updatedAt
            .localeCompare(
              first.updatedAt
            );
        });

    const column =
      document.createElement("section");

    column.className =
      "project-column";

    const columnHeading =
      document.createElement("div");

    columnHeading.className =
      "project-column-heading";

    const title =
      document.createElement("h3");

    title.textContent =
      projectStatusNames[
        projectStatus
      ];

    const count =
      createTextElement(
        "span",
        "project-count",
        String(statusProjects.length)
      );

    columnHeading.append(
      title,
      count
    );

    const list =
      document.createElement("div");

    list.className =
      "project-column-list";

    if (
      statusProjects.length === 0
    ) {
      list.append(
        createTextElement(
          "p",
          "project-column-empty",
          "No projects"
        )
      );
    } else {
      for (
        const project
        of statusProjects
      ) {
        list.append(
          createProjectCard(project)
        );
      }
    }

    column.append(
      columnHeading,
      list
    );

    projectBoard.append(column);
  }
}

async function refreshProjects() {
  emptyProjects.hidden = false;
  emptyProjects.textContent =
    "Opening the Council Chamber...";

  const payload = await apiFetch(
    "/api/projects"
  );

  projects = payload.projects ?? [];

  renderProjects();
  updateIssueProjectOptions();
}

function openIssueDialog(issue = null) {
  issueForm.reset();

  editingIssueId =
    issue?.id || null;

  updateIssueProjectOptions();

  if (issue) {
    issueDialogTitle.textContent =
      "Amend the Issue";

    saveIssueButton.textContent =
      "Save the Amendment";

    issueDateInput.value =
      issue.date;

    issueRegionInput.value =
      issue.region;

    issueProjectInput.value =
      issue.projectId || "";

    issueTitleInput.value =
      issue.title;

    issueDescriptionInput.value =
      issue.description || "";

    issueDurationInput.value =
      issue.duration ?? "";

    issueMoneyInput.value =
      Number(issue.moneyCostCents || 0) /
      100;
  } else {
    issueDialogTitle.textContent =
      "Record an Issue";

    saveIssueButton.textContent =
      "Seal the Record";

    issueDateInput.value =
      getLocalDateString();

    issueMoneyInput.value = "";
  }

  issueDialog.showModal();
  issueTitleInput.focus();
}

function closeIssueDialog() {
  issueDialog.close();
  editingIssueId = null;
}

function openProjectDialog(
  project = null
) {
  projectForm.reset();

  editingProjectId =
    project?.id || null;

  if (project) {
    projectDialogTitle.textContent =
      "Amend the Project";

    saveProjectButton.textContent =
      "Save the Amendment";

    projectNameInput.value =
      project.name;

    projectRegionInput.value =
      project.region;

    projectObjectiveInput.value =
      project.objective || "";

    projectStatusInput.value =
      project.status;

    projectProgressInput.value =
      project.progress;

    projectStartDateInput.value =
      project.startDate || "";

    projectTargetDateInput.value =
      project.targetDate || "";

    projectNextActionInput.value =
      project.nextAction || "";

    projectNotesInput.value =
      project.notes || "";
  } else {
    projectDialogTitle.textContent =
      "Establish a Project";

    saveProjectButton.textContent =
      "Seal the Project";

    projectStatusInput.value =
      "active";

    projectProgressInput.value = "0";

    projectStartDateInput.value =
      getLocalDateString();
  }

  projectDialog.showModal();
  projectNameInput.focus();
}

function closeProjectDialog() {
  projectDialog.close();
  editingProjectId = null;
}

function readLegacyIssues() {
  try {
    const storedValue =
      localStorage.getItem(
        LEGACY_STORAGE_KEY
      );

    if (!storedValue) {
      return [];
    }

    const parsedValue =
      JSON.parse(storedValue);

    return Array.isArray(parsedValue)
      ? parsedValue
      : [];
  } catch (error) {
    console.error(
      "Could not read old browser records:",
      error
    );

    return [];
  }
}

async function migrateLegacyIssues() {
  if (
    localStorage.getItem(
      MIGRATION_STORAGE_KEY
    )
  ) {
    return;
  }

  const legacyIssues =
    readLegacyIssues();
  
  if (legacyIssues.length === 0) {
    localStorage.setItem(
      MIGRATION_STORAGE_KEY,
      "nothing-to-import"
    );

    return;
  }

  const shouldImport =
    window.confirm(
      `You have ${
        legacyIssues.length
      } issue(s) stored only in this ` +
      "browser. Import them into the " +
      "online manor database?"
    );

  if (!shouldImport) {
    return;
  }

  for (
    const legacyIssue
    of legacyIssues
  ) {
    await apiFetch(
      "/api/issues",
      {
        method: "POST",
        body: JSON.stringify({
        date: legacyIssue.date,
        region:
          legacyDepartmentMap[
            legacyIssue.region
          ] ?? legacyIssue.region,
        title: legacyIssue.title,
        description:
          legacyIssue.description ||
          "",
        duration:
          legacyIssue.duration ??
          null,
        moneyCostCents:
          legacyIssue.moneyCostCents ?? 0,
        projectId: null
      })
      }
    );
  }

  localStorage.setItem(
    MIGRATION_STORAGE_KEY,
    "completed"
  );

  await refreshIssues();

  window.alert(
    "Your browser records have been imported into D1."
  );
}

loginForm.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    loginError.hidden = true;
    loginButton.disabled = true;
    loginButton.textContent =
      "Opening the Estate...";

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            password:
              loginPasswordInput.value
          })
        }
      );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ||
          "Login failed."
        );
      }

      loginPasswordInput.value = "";

      showManor();

      await refreshProjects();
      await refreshIssues();
      await migrateLegacyIssues();

      if (window.refreshEstateOffice) {
        await window.refreshEstateOffice();
      }
    } catch (error) {
      loginError.textContent =
        error.message;

      loginError.hidden = false;
    } finally {
      loginButton.disabled = false;
      loginButton.textContent =
        "Enter the Estate";
    }
  }
);

logoutButton.addEventListener(
  "click",
  async () => {
    await fetch(
      "/api/auth/logout",
      {
        method: "POST",
        credentials: "same-origin"
      }
    );

    showLoginScreen();

    issues = [];
    projects = [];

    renderIssues();
    renderProjects();
  }
);

recordButton.addEventListener(
  "click",
  () => openIssueDialog()
);

closeDialogButton.addEventListener(
  "click",
  closeIssueDialog
);

cancelIssueButton.addEventListener(
  "click",
  closeIssueDialog
);

newProjectButton.addEventListener(
  "click",
  () => openProjectDialog()
);

closeProjectDialogButton.addEventListener(
  "click",
  closeProjectDialog
);

cancelProjectButton.addEventListener(
  "click",
  closeProjectDialog
);

issueForm.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    const title =
      issueTitleInput.value.trim();

    const description =
      issueDescriptionInput.value.trim();

    const durationValue =
      issueDurationInput.value.trim();

    let moneyCostCents;

    try {
      moneyCostCents =
        parseMoneyToCents(
          issueMoneyInput.value.trim()
        );
    } catch (error) {
      window.alert(error.message);
      return;
    }

    if (!title) {
      return;
    }

    const issueId =
      editingIssueId;

    const isEditing =
      Boolean(issueId);

    saveIssueButton.disabled = true;

    saveIssueButton.textContent =
      isEditing
        ? "Saving..."
        : "Sealing the Record...";

    try {
      const payload =
        await apiFetch(
          "/api/issues",
          {
            method:
              isEditing
                ? "PUT"
                : "POST",

            body: JSON.stringify({
              id: issueId,

              date:
                issueDateInput.value,

              region:
                issueRegionInput.value,

              projectId:
                issueProjectInput.value ||
                null,

              title,
              description,

              duration:
                durationValue
                  ? Number(durationValue)
                  : null,

              moneyCostCents
            })
          }
        );

      const selectedProject =
        getProjectById(
          payload.issue.projectId
        );

      const completeIssue = {
        ...payload.issue,

        projectName:
          selectedProject?.name ||
          payload.issue.projectName ||
          null
      };

      if (isEditing) {
        issues = issues.map(
          issue =>
            issue.id === issueId
              ? {
                  ...issue,
                  ...completeIssue
                }
              : issue
        );
      } else {
        issues.unshift(
          completeIssue
        );
      }

      renderIssues();
      closeIssueDialog();
    } catch (error) {
      window.alert(error.message);
    } finally {
      saveIssueButton.disabled = false;

      saveIssueButton.textContent =
        isEditing
          ? "Save the Amendment"
          : "Seal the Record";
    }
  }
);

projectForm.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    const projectData = {
      id: editingProjectId,
      name:
        projectNameInput.value.trim(),
      region:
        projectRegionInput.value,
      objective:
        projectObjectiveInput.value
          .trim(),
      status:
        projectStatusInput.value,
      progress: Number(
        projectProgressInput.value
      ),
      startDate:
        projectStartDateInput.value ||
        null,
      targetDate:
        projectTargetDateInput.value ||
        null,
      nextAction:
        projectNextActionInput.value
          .trim(),
      notes:
        projectNotesInput.value.trim()
    };

    saveProjectButton.disabled = true;
    saveProjectButton.textContent =
      editingProjectId
        ? "Saving..."
        : "Establishing...";

    try {
      const payload =
        await apiFetch(
          "/api/projects",
          {
            method: editingProjectId
              ? "PUT"
              : "POST",
            body: JSON.stringify(
              projectData
            )
          }
        );

      if (editingProjectId) {
        projects = projects.map(
          project =>
            project.id ===
            editingProjectId
              ? {
                  ...project,
                  ...payload.project
                }
              : project
        );

        issues = issues.map(issue => {
          if (
            issue.projectId ===
            editingProjectId
          ) {
            return {
              ...issue,
              projectName:
                payload.project.name
            };
          }

          return issue;
        });
      } else {
        projects.push(
          payload.project
        );
      }

      renderProjects();
      renderIssues();
      updateIssueProjectOptions();
      
      if (window.refreshEstateOffice) {
        window.refreshEstateOffice().catch(
          console.error
        );
      }
      
      closeProjectDialog();
      
    } catch (error) {
      window.alert(error.message);
    } finally {
      saveProjectButton.disabled =
        false;

      saveProjectButton.textContent =
        editingProjectId
          ? "Save the Amendment"
          : "Seal the Project";
    }
  }
);

issueDialog.addEventListener(
  "click",
  event => {
    if (
      event.target === issueDialog
    ) {
      closeIssueDialog();
    }
  }
);

projectDialog.addEventListener(
  "click",
  event => {
    if (
      event.target ===
      projectDialog
    ) {
      closeProjectDialog();
    }
  }
);

async function startManor() {
  try {
    const authenticated =
      await checkSession();

    if (!authenticated) {
      showLoginScreen();
      return;
    }

    showManor();

    await refreshProjects();
    await refreshIssues();
    await migrateLegacyIssues();
    if (window.refreshEstateOffice) {
      await window.refreshEstateOffice();
    }
  } catch (error) {
    console.error(error);
    showLoginScreen();
  }
}

renderDepartmentCards();

populateDepartmentSelect(
  issueRegionInput
);

populateDepartmentSelect(
  projectRegionInput
);

departmentBackButton.addEventListener(
  "click",
  () => {
    history.pushState(
      null,
      "",
      `${location.pathname}${location.search}`
    );

    routeManorView();

    window.scrollTo({
      top: 0,
      behavior: "instant"
    });
  }
);

window.addEventListener(
  "hashchange",
  routeManorView
);

startManor();
