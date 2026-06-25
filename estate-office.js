const tomorrowDateElement =
  document.querySelector("#tomorrow-date");

const tomorrowTaskList =
  document.querySelector("#tomorrow-task-list");

const emptyTasks =
  document.querySelector("#empty-tasks");

const newTaskButton =
  document.querySelector("#new-task-button");

const taskDialog =
  document.querySelector("#task-dialog");

const taskForm =
  document.querySelector("#task-form");

const taskDialogTitle =
  document.querySelector("#task-dialog-title");

const taskDialogDate =
  document.querySelector("#task-dialog-date");

const taskTitleInput =
  document.querySelector("#task-title");

const taskProjectInput =
  document.querySelector("#task-project");

const taskDescriptionInput =
  document.querySelector("#task-description");

const closeTaskDialogButton =
  document.querySelector("#close-task-dialog");

const cancelTaskButton =
  document.querySelector("#cancel-task");

const saveTaskButton =
  document.querySelector("#save-task-button");

const milestoneList =
  document.querySelector("#milestone-list");

const emptyMilestones =
  document.querySelector("#empty-milestones");

const newMilestoneButton =
  document.querySelector("#new-milestone-button");

const milestoneDialog =
  document.querySelector("#milestone-dialog");

const milestoneForm =
  document.querySelector("#milestone-form");

const milestoneDialogTitle =
  document.querySelector(
    "#milestone-dialog-title"
  );

const milestoneProjectInput =
  document.querySelector("#milestone-project");

const milestoneTitleInput =
  document.querySelector("#milestone-title");

const milestoneTargetDateInput =
  document.querySelector(
    "#milestone-target-date"
  );

const milestoneNotesInput =
  document.querySelector("#milestone-notes");

const closeMilestoneDialogButton =
  document.querySelector(
    "#close-milestone-dialog"
  );

const cancelMilestoneButton =
  document.querySelector(
    "#cancel-milestone"
  );

const saveMilestoneButton =
  document.querySelector(
    "#save-milestone-button"
  );

let officeProjects = [];
let tomorrowTasks = [];
let officeMilestones = [];

let editingTaskId = null;
let editingMilestoneId = null;

function getLocalDateAtOffset(dayOffset) {
  const date = new Date();

  date.setDate(date.getDate() + dayOffset);

  const timezoneOffset =
    date.getTimezoneOffset() * 60_000;

  return new Date(
    date.getTime() - timezoneOffset
  )
    .toISOString()
    .slice(0, 10);
}

function getTomorrowDate() {
  return getLocalDateAtOffset(1);
}

function formatOfficeDate(dateString, long = false) {
  if (!dateString) {
    return "";
  }

  const date = new Date(
    `${dateString}T12:00:00`
  );

  return new Intl.DateTimeFormat(
    "en-US",
    long
      ? {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }
      : {
          year: "numeric",
          month: "short",
          day: "numeric"
        }
  ).format(date);
}

async function officeApiFetch(path, options = {}) {
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
    if (
      typeof window.showLoginScreen ===
      "function"
    ) {
      window.showLoginScreen();
    }

    throw new Error(
      payload?.error ||
      "Your manor session has expired."
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

function createOfficeElement(
  tag,
  className,
  text
) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function getOfficeProject(projectId) {
  return (
    officeProjects.find(
      project => project.id === projectId
    ) || null
  );
}

function populateProjectSelect(
  select,
  allowNoProject
) {
  const previousValue = select.value;

  select.replaceChildren();

  if (allowNoProject) {
    const noProject =
      document.createElement("option");

    noProject.value = "";
    noProject.textContent =
      "No related project";

    select.append(noProject);
  }

  const sortedProjects =
    [...officeProjects].sort(
      (first, second) =>
        first.name.localeCompare(second.name)
    );

  for (const project of sortedProjects) {
    const option =
      document.createElement("option");

    option.value = project.id;
    option.textContent = project.name;

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

function taskPayload(task, overrides = {}) {
  return {
    id: task.id,
    taskDate: task.taskDate,
    title: task.title,
    description: task.description || "",
    projectId: task.projectId || null,
    completed: Boolean(task.completed),
    completedAt: task.completedAt || null,
    ...overrides
  };
}

function milestonePayload(
  milestone,
  overrides = {}
) {
  return {
    id: milestone.id,
    projectId: milestone.projectId,
    title: milestone.title,
    targetDate: milestone.targetDate,
    notes: milestone.notes || "",
    completed: Boolean(milestone.completed),
    completedAt:
      milestone.completedAt || null,
    ...overrides
  };
}

function createTaskCard(task) {
  const card = createOfficeElement(
    "article",
    "office-card"
  );

  if (task.completed) {
    card.classList.add("is-completed");
  }

  const header = createOfficeElement(
    "div",
    "office-card-header"
  );

  const headingContainer =
    document.createElement("div");

  const title = createOfficeElement(
    "h4",
    "office-card-title",
    task.title
  );

  headingContainer.append(title);

  const project =
    getOfficeProject(task.projectId);

  const projectName =
    project?.name ||
    task.projectName ||
    null;

  if (projectName) {
    headingContainer.append(
      createOfficeElement(
        "p",
        "office-card-project",
        `Project: ${projectName}`
      )
    );
  }

  const status = createOfficeElement(
    "span",
    "office-status",
    task.completed ? "Completed" : "Pending"
  );

  header.append(headingContainer, status);
  card.append(header);

  if (task.description) {
    card.append(
      createOfficeElement(
        "p",
        "office-card-description",
        task.description
      )
    );
  }

  const actions = createOfficeElement(
    "div",
    "office-card-actions"
  );

  const completeButton =
    createOfficeElement(
      "button",
      "office-complete-button",
      task.completed ? "Reopen" : "Complete"
    );

  completeButton.type = "button";

  completeButton.addEventListener(
    "click",
    async () => {
      completeButton.disabled = true;

      try {
        const payload =
          await officeApiFetch(
            "/api/tasks",
            {
              method: "PUT",
              body: JSON.stringify(
                taskPayload(task, {
                  completed: !task.completed,
                  completedAt: task.completed
                    ? null
                    : task.completedAt
                })
              )
            }
          );

        tomorrowTasks =
          tomorrowTasks.map(item =>
            item.id === task.id
              ? payload.task
              : item
          );

        renderTomorrowTasks();
      } catch (error) {
        window.alert(error.message);
        completeButton.disabled = false;
      }
    }
  );

  const editButton =
    createOfficeElement(
      "button",
      "office-edit-button",
      "Edit"
    );

  editButton.type = "button";

  editButton.addEventListener(
    "click",
    () => openTaskDialog(task)
  );

  const deleteButton =
    createOfficeElement(
      "button",
      "office-delete-button",
      "Delete"
    );

  deleteButton.type = "button";

  deleteButton.addEventListener(
    "click",
    async () => {
      const confirmed = window.confirm(
        `Delete the task “${task.title}”?`
      );

      if (!confirmed) {
        return;
      }

      deleteButton.disabled = true;

      try {
        await officeApiFetch(
          `/api/tasks?id=${encodeURIComponent(
            task.id
          )}`,
          {
            method: "DELETE"
          }
        );

        tomorrowTasks =
          tomorrowTasks.filter(
            item => item.id !== task.id
          );

        renderTomorrowTasks();
      } catch (error) {
        window.alert(error.message);
        deleteButton.disabled = false;
      }
    }
  );

  actions.append(
    completeButton,
    editButton,
    deleteButton
  );

  card.append(actions);

  return card;
}

function renderTomorrowTasks() {
  tomorrowTaskList.replaceChildren();

  const orderedTasks =
    [...tomorrowTasks].sort(
      (first, second) => {
        const completedDifference =
          Number(first.completed) -
          Number(second.completed);

        if (completedDifference !== 0) {
          return completedDifference;
        }

        return first.createdAt.localeCompare(
          second.createdAt
        );
      }
    );

  emptyTasks.hidden =
    orderedTasks.length > 0;

  for (const task of orderedTasks) {
    tomorrowTaskList.append(
      createTaskCard(task)
    );
  }
}

function isMilestoneOverdue(milestone) {
  return (
    !milestone.completed &&
    milestone.targetDate <
      getLocalDateAtOffset(0)
  );
}

function createMilestoneCard(milestone) {
  const card = createOfficeElement(
    "article",
    "office-card"
  );

  if (milestone.completed) {
    card.classList.add("is-completed");
  }

  const header = createOfficeElement(
    "div",
    "office-card-header"
  );

  const title = createOfficeElement(
    "h4",
    "office-card-title",
    milestone.title
  );

  const status = createOfficeElement(
    "span",
    "office-status",
    milestone.completed
      ? "Achieved"
      : "Pending"
  );

  header.append(title, status);
  card.append(header);

  const target = createOfficeElement(
    "p",
    "milestone-target",
    `Target: ${formatOfficeDate(
      milestone.targetDate
    )}`
  );

  if (isMilestoneOverdue(milestone)) {
    target.classList.add("is-overdue");
    target.textContent += " · Overdue";
  }

  card.append(target);

  if (milestone.notes) {
    card.append(
      createOfficeElement(
        "p",
        "office-card-description",
        milestone.notes
      )
    );
  }

  const actions = createOfficeElement(
    "div",
    "office-card-actions"
  );

  const completeButton =
    createOfficeElement(
      "button",
      "office-complete-button",
      milestone.completed
        ? "Reopen"
        : "Mark Achieved"
    );

  completeButton.type = "button";

  completeButton.addEventListener(
    "click",
    async () => {
      completeButton.disabled = true;

      try {
        const payload =
          await officeApiFetch(
            "/api/milestones",
            {
              method: "PUT",
              body: JSON.stringify(
                milestonePayload(
                  milestone,
                  {
                    completed:
                      !milestone.completed,
                    completedAt:
                      milestone.completed
                        ? null
                        : milestone.completedAt
                  }
                )
              )
            }
          );

        officeMilestones =
          officeMilestones.map(item =>
            item.id === milestone.id
              ? payload.milestone
              : item
          );

        renderMilestones();
      } catch (error) {
        window.alert(error.message);
        completeButton.disabled = false;
      }
    }
  );

  const editButton =
    createOfficeElement(
      "button",
      "office-edit-button",
      "Edit"
    );

  editButton.type = "button";

  editButton.addEventListener(
    "click",
    () => openMilestoneDialog(milestone)
  );

  const deleteButton =
    createOfficeElement(
      "button",
      "office-delete-button",
      "Delete"
    );

  deleteButton.type = "button";

  deleteButton.addEventListener(
    "click",
    async () => {
      const confirmed = window.confirm(
        `Delete the milestone “${milestone.title}”?`
      );

      if (!confirmed) {
        return;
      }

      deleteButton.disabled = true;

      try {
        await officeApiFetch(
          `/api/milestones?id=${
            encodeURIComponent(
              milestone.id
            )
          }`,
          {
            method: "DELETE"
          }
        );

        officeMilestones =
          officeMilestones.filter(
            item =>
              item.id !== milestone.id
          );

        renderMilestones();
      } catch (error) {
        window.alert(error.message);
        deleteButton.disabled = false;
      }
    }
  );

  actions.append(
    completeButton,
    editButton,
    deleteButton
  );

  card.append(actions);

  return card;
}

function renderMilestones() {
  milestoneList.replaceChildren();

  emptyMilestones.hidden =
    officeMilestones.length > 0;

  const projectGroups = new Map();

  for (const milestone of officeMilestones) {
    if (
      !projectGroups.has(
        milestone.projectId
      )
    ) {
      projectGroups.set(
        milestone.projectId,
        []
      );
    }

    projectGroups
      .get(milestone.projectId)
      .push(milestone);
  }

  const sortedGroups =
    [...projectGroups.entries()].sort(
      ([firstProjectId], [secondProjectId]) => {
        const firstProject =
          getOfficeProject(firstProjectId);

        const secondProject =
          getOfficeProject(secondProjectId);

        return (
          firstProject?.name || ""
        ).localeCompare(
          secondProject?.name || ""
        );
      }
    );

  for (
    const [projectId, milestones]
    of sortedGroups
  ) {
    const group = createOfficeElement(
      "section",
      "milestone-project-group"
    );

    const project =
      getOfficeProject(projectId);

    const projectName =
      project?.name ||
      milestones[0]?.projectName ||
      "Unnamed Project";

    group.append(
      createOfficeElement(
        "h4",
        "milestone-project-heading",
        projectName
      )
    );

    const items = createOfficeElement(
      "div",
      "milestone-project-items"
    );

    milestones
      .sort((first, second) => {
        const completionDifference =
          Number(first.completed) -
          Number(second.completed);

        if (completionDifference !== 0) {
          return completionDifference;
        }

        return first.targetDate.localeCompare(
          second.targetDate
        );
      })
      .forEach(milestone => {
        items.append(
          createMilestoneCard(milestone)
        );
      });

    group.append(items);
    milestoneList.append(group);
  }
}

async function loadOfficeProjects() {
  const payload = await officeApiFetch(
    "/api/projects"
  );

  officeProjects =
    payload.projects ?? [];

  populateProjectSelect(
    taskProjectInput,
    true
  );

  populateProjectSelect(
    milestoneProjectInput,
    false
  );
}

async function refreshEstateOffice() {
  const tomorrowDate = getTomorrowDate();

  tomorrowDateElement.textContent =
    formatOfficeDate(tomorrowDate, true);

  taskDialogDate.textContent =
    `For ${formatOfficeDate(
      tomorrowDate,
      true
    )}`;

  emptyTasks.hidden = false;
  emptyTasks.textContent =
    "Opening tomorrow's orders...";

  emptyMilestones.hidden = false;
  emptyMilestones.textContent =
    "Opening the milestone register...";

  const [
    projectPayload,
    taskPayloadResult,
    milestonePayloadResult
  ] = await Promise.all([
    officeApiFetch("/api/projects"),

    officeApiFetch(
      `/api/tasks?date=${
        encodeURIComponent(tomorrowDate)
      }`
    ),

    officeApiFetch("/api/milestones")
  ]);

  officeProjects =
    projectPayload.projects ?? [];

  tomorrowTasks =
    taskPayloadResult.tasks ?? [];

  officeMilestones =
    milestonePayloadResult.milestones ?? [];

  populateProjectSelect(
    taskProjectInput,
    true
  );

  populateProjectSelect(
    milestoneProjectInput,
    false
  );

  emptyTasks.textContent =
    "No orders have been prepared for tomorrow.";

  emptyMilestones.textContent =
    "No project milestones have been established.";

  renderTomorrowTasks();
  renderMilestones();
}

async function openTaskDialog(task = null) {
  await loadOfficeProjects();

  taskForm.reset();
  editingTaskId = task?.id || null;

  taskDialogTitle.textContent = task
    ? "Amend Tomorrow's Order"
    : "Prepare Tomorrow's Order";

  saveTaskButton.textContent = task
    ? "Save the Amendment"
    : "Seal the Order";

  if (task) {
    taskTitleInput.value = task.title;

    taskProjectInput.value =
      task.projectId || "";

    taskDescriptionInput.value =
      task.description || "";
  }

  taskDialog.showModal();
  taskTitleInput.focus();
}

function closeTaskDialog() {
  taskDialog.close();
  editingTaskId = null;
}

async function openMilestoneDialog(
  milestone = null
) {
  await loadOfficeProjects();

  if (officeProjects.length === 0) {
    window.alert(
      "Establish a project in the Council Chamber before creating a milestone."
    );

    return;
  }

  milestoneForm.reset();

  editingMilestoneId =
    milestone?.id || null;

  milestoneDialogTitle.textContent =
    milestone
      ? "Amend the Milestone"
      : "Establish a Milestone";

  saveMilestoneButton.textContent =
    milestone
      ? "Save the Amendment"
      : "Seal the Milestone";

  if (milestone) {
    milestoneProjectInput.value =
      milestone.projectId;

    milestoneTitleInput.value =
      milestone.title;

    milestoneTargetDateInput.value =
      milestone.targetDate;

    milestoneNotesInput.value =
      milestone.notes || "";
  }

  milestoneDialog.showModal();
  milestoneTitleInput.focus();
}

function closeMilestoneDialog() {
  milestoneDialog.close();
  editingMilestoneId = null;
}

newTaskButton.addEventListener(
  "click",
  () => {
    openTaskDialog().catch(error => {
      window.alert(error.message);
    });
  }
);

closeTaskDialogButton.addEventListener(
  "click",
  closeTaskDialog
);

cancelTaskButton.addEventListener(
  "click",
  closeTaskDialog
);

newMilestoneButton.addEventListener(
  "click",
  () => {
    openMilestoneDialog().catch(error => {
      window.alert(error.message);
    });
  }
);

closeMilestoneDialogButton.addEventListener(
  "click",
  closeMilestoneDialog
);

cancelMilestoneButton.addEventListener(
  "click",
  closeMilestoneDialog
);

taskForm.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    saveTaskButton.disabled = true;

    saveTaskButton.textContent =
      editingTaskId
        ? "Saving..."
        : "Sealing...";

    try {
      const existingTask =
        tomorrowTasks.find(
          task => task.id === editingTaskId
        );

      const payload =
        await officeApiFetch(
          "/api/tasks",
          {
            method: editingTaskId
              ? "PUT"
              : "POST",

            body: JSON.stringify({
              id: editingTaskId,
              taskDate: getTomorrowDate(),
              title:
                taskTitleInput.value.trim(),
              description:
                taskDescriptionInput.value
                  .trim(),
              projectId:
                taskProjectInput.value ||
                null,
              completed:
                existingTask?.completed ||
                false,
              completedAt:
                existingTask?.completedAt ||
                null
            })
          }
        );

      if (editingTaskId) {
        tomorrowTasks =
          tomorrowTasks.map(task =>
            task.id === editingTaskId
              ? payload.task
              : task
          );
      } else {
        tomorrowTasks.push(payload.task);
      }

      renderTomorrowTasks();
      closeTaskDialog();
    } catch (error) {
      window.alert(error.message);
    } finally {
      saveTaskButton.disabled = false;
      saveTaskButton.textContent =
        editingTaskId
          ? "Save the Amendment"
          : "Seal the Order";
    }
  }
);

milestoneForm.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    saveMilestoneButton.disabled = true;

    saveMilestoneButton.textContent =
      editingMilestoneId
        ? "Saving..."
        : "Sealing...";

    try {
      const existingMilestone =
        officeMilestones.find(
          milestone =>
            milestone.id ===
            editingMilestoneId
        );

      const payload =
        await officeApiFetch(
          "/api/milestones",
          {
            method: editingMilestoneId
              ? "PUT"
              : "POST",

            body: JSON.stringify({
              id: editingMilestoneId,
              projectId:
                milestoneProjectInput.value,
              title:
                milestoneTitleInput.value
                  .trim(),
              targetDate:
                milestoneTargetDateInput
                  .value,
              notes:
                milestoneNotesInput.value
                  .trim(),
              completed:
                existingMilestone?.completed ||
                false,
              completedAt:
                existingMilestone
                  ?.completedAt || null
            })
          }
        );

      if (editingMilestoneId) {
        officeMilestones =
          officeMilestones.map(
            milestone =>
              milestone.id ===
              editingMilestoneId
                ? payload.milestone
                : milestone
          );
      } else {
        officeMilestones.push(
          payload.milestone
        );
      }

      renderMilestones();
      closeMilestoneDialog();
    } catch (error) {
      window.alert(error.message);
    } finally {
      saveMilestoneButton.disabled = false;

      saveMilestoneButton.textContent =
        editingMilestoneId
          ? "Save the Amendment"
          : "Seal the Milestone";
    }
  }
);

taskDialog.addEventListener(
  "click",
  event => {
    if (event.target === taskDialog) {
      closeTaskDialog();
    }
  }
);

milestoneDialog.addEventListener(
  "click",
  event => {
    if (
      event.target === milestoneDialog
    ) {
      closeMilestoneDialog();
    }
  }
);

window.refreshEstateOffice =
  refreshEstateOffice;
