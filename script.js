const LEGACY_STORAGE_KEY =
  "lord-manor-issues-v1";

const MIGRATION_STORAGE_KEY =
  "lord-manor-d1-migration-v1";

const regionNames = {
  laboratory: "The Laboratory",
  academy: "The Academy",
  "great-hall": "The Great Hall",
  "map-room": "The Map Room",
  "training-ground": "The Training Ground",
  gallery: "The Gallery",
  "council-chamber": "The Council Chamber"
};

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

let issues = [];
let projects = [];
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

function renderIssues() {
  issueList.replaceChildren();

  const sortedIssues = [...issues].sort(
    (first, second) => {
      const firstTime =
        `${first.date}-${first.createdAt}`;

      const secondTime =
        `${second.date}-${second.createdAt}`;

      return secondTime.localeCompare(
        firstTime
      );
    }
  );

  if (sortedIssues.length === 0) {
    emptyIssues.hidden = false;
    emptyIssues.textContent =
      "No issues have yet been recorded.";
    return;
  }

  emptyIssues.hidden = true;

  for (const issue of sortedIssues) {
    const card =
      document.createElement("article");

    card.className = "issue-card";

    const header =
      document.createElement("div");

    header.className =
      "issue-card-header";

    const headingContainer =
      document.createElement("div");

    const durationText =
      issue.duration !== null &&
      issue.duration !== undefined
        ? ` · ${issue.duration} minutes`
        : "";

    const meta = createTextElement(
      "p",
      "issue-meta",
      `${regionNames[issue.region]} · ` +
      `${formatDate(issue.date)}` +
      durationText
    );

    const title = createTextElement(
      "h3",
      "",
      issue.title
    );

    headingContainer.append(meta, title);

    const project =
      getProjectById(issue.projectId);

    const relatedProjectName =
      project?.name ||
      issue.projectName ||
      null;

    if (relatedProjectName) {
      const projectText =
        createTextElement(
          "p",
          "issue-project",
          `Project: ${relatedProjectName}`
        );

      headingContainer.append(projectText);
    }

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

    header.append(
      headingContainer,
      deleteButton
    );

    card.append(header);

    if (issue.description) {
      const description =
        createTextElement(
          "p",
          "issue-description",
          issue.description
        );

      card.append(description);
    }

    issueList.append(card);
  }
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
    regionNames[project.region]
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

function openIssueDialog() {
  issueForm.reset();
  issueDateInput.value =
    getLocalDateString();

  updateIssueProjectOptions();

  issueDialog.showModal();
  issueTitleInput.focus();
}

function closeIssueDialog() {
  issueDialog.close();
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
          region: legacyIssue.region,
          title: legacyIssue.title,
          description:
            legacyIssue.description ||
            "",
          duration:
            legacyIssue.duration ??
            null,
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

    issues = [];
    projects = [];

    renderIssues();
    renderProjects();

    showLoginScreen();
  }
);

recordButton.addEventListener(
  "click",
  openIssueDialog
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

    if (!title) {
      return;
    }

    const submitButton =
      issueForm.querySelector(
        'button[type="submit"]'
      );

    submitButton.disabled = true;
    submitButton.textContent =
      "Sealing the Record...";

    try {
      const payload =
        await apiFetch(
          "/api/issues",
          {
            method: "POST",
            body: JSON.stringify({
              date:
                issueDateInput.value,
              region:
                issueRegionInput.value,
              projectId:
                issueProjectInput.value ||
                null,
              title,
              description,
              duration: durationValue
                ? Number(durationValue)
                : null
            })
          }
        );

      const selectedProject =
        getProjectById(
          payload.issue.projectId
        );

      issues.unshift({
        ...payload.issue,
        projectName:
          selectedProject?.name ||
          null
      });

      renderIssues();
      closeIssueDialog();
    } catch (error) {
      window.alert(error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent =
        "Seal the Record";
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

startManor();
