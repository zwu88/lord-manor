const plannerHeading =
  document.querySelector("#planner-heading");

const plannerDateLabel =
  document.querySelector("#planner-date-label");

const plannerPreviousDayButton =
  document.querySelector("#planner-previous-day");

const plannerNextDayButton =
  document.querySelector("#planner-next-day");

const plannerTodayButton =
  document.querySelector("#planner-today-button");

const plannerTomorrowButton =
  document.querySelector("#planner-tomorrow-button");

const plannerDateInput =
  document.querySelector("#planner-date-input");

const plannerWeek =
  document.querySelector("#planner-week");

const plannerError =
  document.querySelector("#planner-error");

const tomorrowTaskList =
  document.querySelector("#tomorrow-task-list");

const emptyTasks =
  document.querySelector("#empty-tasks");

const overdueTaskList =
  document.querySelector("#overdue-task-list");

const emptyOverdueTasks =
  document.querySelector("#empty-overdue-tasks");

const newTaskButton =
  document.querySelector("#new-task-button");

const taskDialog =
  document.querySelector("#task-dialog");

const taskForm =
  document.querySelector("#task-form");

const taskDialogTitle =
  document.querySelector("#task-dialog-title");

const taskDateInput =
  document.querySelector("#task-date");

const taskDateError =
  document.querySelector("#task-date-error");

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
let plannerSelectedTasks = [];
let plannerOverdueTasks = [];
let plannerWeekDays = [];
let officeMilestones = [];

let editingTaskId = null;
let editingMilestoneId = null;
let selectedPlannerDate = null;
let plannerToday = null;
let plannerTomorrow = null;
let plannerRequestSequence = 0;
let plannerLoading = false;

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

function addOfficeDays(dateString, days) {
  const date = new Date(
    `${dateString}T00:00:00.000Z`
  );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return date.toISOString().slice(0, 10);
}

function isValidOfficeDate(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(
    `${value}T00:00:00.000Z`
  );

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) ===
      value
  );
}

function describePlannerDate(dateString) {
  if (dateString === plannerToday) {
    return "Today";
  }

  if (dateString === plannerTomorrow) {
    return "Tomorrow";
  }

  return formatOfficeDate(dateString, true);
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

function normalizeOfficeBoolean(value) {
  return value === true || value === 1 || value === "1";
}

function notifyChronicleOfOfficeRecordChange() {
  if (
    typeof window.refreshManorChronicle ===
    "function"
  ) {
    window.refreshManorChronicle();
  }

  if (
    typeof window.refreshWeeklyEstateReport ===
    "function"
  ) {
    window.refreshWeeklyEstateReport();
  }
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

function createTaskCard(
  task,
  { overdue = false } = {}
) {
  const card = createOfficeElement(
    "article",
    "office-card"
  );

  if (
    task.taskDate &&
    task.taskDate < plannerToday
  ) {
    card.classList.add("is-overdue-order");
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

  header.append(headingContainer);
  card.append(header);

  if (overdue || task.taskDate < plannerToday) {
    const meta = createOfficeElement(
      "p",
      "office-card-meta",
      overdue
        ? `Scheduled ${formatOfficeDate(task.taskDate)}`
        : "Overdue"
    );

    card.append(meta);
  }

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
      "Done Today"
    );

  completeButton.type = "button";

  completeButton.addEventListener(
    "click",
    async () => {
      const confirmed = window.confirm(
        `Mark “${task.title}” as completed today? It will be removed from tomorrow’s plan and will not appear in tomorrow’s Chronicle.`
      );

      if (!confirmed) {
        return;
      }

      completeButton.disabled = true;

      try {
        await officeApiFetch(
            "/api/tasks",
            {
              method: "PUT",
              body: JSON.stringify(
                taskPayload(task, {
                  completed: true
                })
              )
            }
          );

        await refreshOrderPlanner();
        notifyChronicleOfOfficeRecordChange();
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

  const rescheduleButton =
    createOfficeElement(
      "button",
      "office-edit-button",
      "Reschedule"
    );

  rescheduleButton.type = "button";

  rescheduleButton.addEventListener(
    "click",
    () => {
      openTaskDialog(task, {
        focusDate: true
      }).catch(error => {
        window.alert(error.message);
      });
    }
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

        await refreshOrderPlanner();
        notifyChronicleOfOfficeRecordChange();
      } catch (error) {
        window.alert(error.message);
        deleteButton.disabled = false;
      }
    }
  );

  actions.append(completeButton);

  if (overdue) {
    actions.append(rescheduleButton);
  }

  actions.append(editButton, deleteButton);

  card.append(actions);

  return card;
}

function renderTomorrowTasks() {
  tomorrowTaskList.replaceChildren();

  const orderedTasks =
    plannerSelectedTasks
      .filter(
        task =>
          !normalizeOfficeBoolean(
            task.completed
          )
      )
      .sort(
      (first, second) => {
        return String(
          first.createdAt ?? ""
        ).localeCompare(
          String(second.createdAt ?? "")
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

function renderOverdueTasks() {
  overdueTaskList.replaceChildren();

  emptyOverdueTasks.hidden =
    plannerOverdueTasks.length > 0;

  for (const task of plannerOverdueTasks) {
    overdueTaskList.append(
      createTaskCard(task, {
        overdue: true
      })
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
        notifyChronicleOfOfficeRecordChange();
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
        notifyChronicleOfOfficeRecordChange();
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

function renderPlannerWeek() {
  plannerWeek.replaceChildren();

  for (const day of plannerWeekDays) {
    const button =
      createOfficeElement(
        "button",
        "planner-day",
        ""
      );

    button.type = "button";
    button.dataset.date = day.date;

    if (day.date === selectedPlannerDate) {
      button.classList.add("is-selected");
      button.setAttribute(
        "aria-current",
        "date"
      );
    }

    if (day.date === plannerToday) {
      button.classList.add("is-today");
    }

    if (day.date === plannerTomorrow) {
      button.classList.add("is-tomorrow");
    }

    const weekday =
      createOfficeElement(
        "span",
        "planner-day-weekday",
        new Intl.DateTimeFormat("en-US", {
          weekday: "short"
        }).format(
          new Date(`${day.date}T12:00:00`)
        )
      );

    const date =
      createOfficeElement(
        "span",
        "planner-day-date",
        new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric"
        }).format(
          new Date(`${day.date}T12:00:00`)
        )
      );

    const count =
      createOfficeElement(
        "span",
        "planner-day-count",
        `${day.activeCount} ${
          day.activeCount === 1
            ? "Order"
            : "Orders"
        }`
      );

    button.append(weekday, date, count);

    button.addEventListener("click", () => {
      selectPlannerDate(day.date);
    });

    plannerWeek.append(button);
  }
}

function setPlannerControls() {
  plannerLoading = Boolean(plannerLoading);

  const disabled = plannerLoading;

  plannerPreviousDayButton.disabled =
    disabled;
  plannerNextDayButton.disabled = disabled;
  plannerTodayButton.disabled =
    disabled ||
    selectedPlannerDate === plannerToday;
  plannerTomorrowButton.disabled =
    disabled ||
    selectedPlannerDate === plannerTomorrow;
  plannerDateInput.disabled = disabled;
  plannerDateInput.value =
    selectedPlannerDate || "";
}

function renderOrderPlanner() {
  plannerHeading.textContent =
    `Orders for ${
      describePlannerDate(selectedPlannerDate)
    }`;

  plannerDateLabel.textContent =
    formatOfficeDate(
      selectedPlannerDate,
      true
    );

  emptyTasks.textContent =
    selectedPlannerDate < plannerToday
      ? "No active Orders remain for this date."
      : "No Orders remain for this date.";

  renderTomorrowTasks();
  renderOverdueTasks();
  renderPlannerWeek();
  setPlannerControls();
}

function selectPlannerDate(dateString) {
  if (!isValidOfficeDate(dateString)) {
    return;
  }

  selectedPlannerDate = dateString;
  refreshOrderPlanner().catch(error => {
    plannerError.hidden = false;
    plannerError.textContent = error.message;
  });
}

async function refreshOrderPlanner() {
  if (!selectedPlannerDate) {
    selectedPlannerDate = getTomorrowDate();
  }

  plannerToday = getLocalDateAtOffset(0);
  plannerTomorrow = addOfficeDays(
    plannerToday,
    1
  );

  const sequence =
    plannerRequestSequence + 1;

  plannerRequestSequence = sequence;
  plannerLoading = true;
  plannerError.hidden = true;
  plannerError.textContent = "";
  setPlannerControls();

  try {
    const payload =
      await officeApiFetch(
        `/api/order-planner?date=${
          encodeURIComponent(
            selectedPlannerDate
          )
        }&today=${encodeURIComponent(
          plannerToday
        )}`
      );

    if (sequence !== plannerRequestSequence) {
      return;
    }

    selectedPlannerDate =
      payload.selectedDate;
    plannerToday = payload.today;
    plannerTomorrow = payload.tomorrow;
    plannerSelectedTasks =
      payload.selectedOrders ?? [];
    plannerOverdueTasks =
      payload.overdueOrders ?? [];
    plannerWeekDays = payload.week ?? [];

    renderOrderPlanner();
  } catch (error) {
    if (sequence !== plannerRequestSequence) {
      return;
    }

    plannerError.hidden = false;
    plannerError.textContent = error.message;
  } finally {
    if (sequence === plannerRequestSequence) {
      plannerLoading = false;
      setPlannerControls();
    }
  }
}

async function refreshEstateOffice() {
  selectedPlannerDate =
    selectedPlannerDate || getTomorrowDate();

  emptyTasks.hidden = false;
  emptyTasks.textContent =
    "Opening the Order Planner...";

  emptyOverdueTasks.hidden = false;
  emptyOverdueTasks.textContent =
    "Opening overdue Orders...";

  emptyMilestones.hidden = false;
  emptyMilestones.textContent =
    "Opening the milestone register...";

  const [
    projectPayload,
    milestonePayloadResult
  ] = await Promise.all([
    officeApiFetch("/api/projects"),

    officeApiFetch("/api/milestones")
  ]);

  officeProjects =
    projectPayload.projects ?? [];

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

  emptyMilestones.textContent =
    "No project milestones have been established.";

  await refreshOrderPlanner();
  renderMilestones();
}

async function openTaskDialog(
  task = null,
  { focusDate = false } = {}
) {
  await loadOfficeProjects();

  taskForm.reset();
  editingTaskId = task?.id || null;
  taskDateError.hidden = true;
  taskDateError.textContent = "";

  taskDialogTitle.textContent = task
    ? "Amend the Order"
    : "Prepare an Order";

  saveTaskButton.textContent = task
    ? "Save the Amendment"
    : "Seal the Order";

  if (task) {
    taskTitleInput.value = task.title;
    taskDateInput.value = task.taskDate;

    taskProjectInput.value =
      task.projectId || "";

    taskDescriptionInput.value =
      task.description || "";
  } else {
    taskDateInput.value =
      selectedPlannerDate || getTomorrowDate();
  }

  taskDialog.showModal();

  if (focusDate) {
    taskDateInput.focus();
  } else {
    taskTitleInput.focus();
  }
}

function closeTaskDialog() {
  taskDialog.close();
  editingTaskId = null;
  taskDateError.hidden = true;
  taskDateError.textContent = "";
  newTaskButton.focus();
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
    if (
      selectedPlannerDate &&
      plannerToday &&
      selectedPlannerDate < plannerToday
    ) {
      window.alert(
        "Choose today or a future date in the Order form before sealing a new Order."
      );
    }

    openTaskDialog().catch(error => {
      window.alert(error.message);
    });
  }
);

plannerPreviousDayButton.addEventListener(
  "click",
  () => {
    selectPlannerDate(
      addOfficeDays(selectedPlannerDate, -1)
    );
  }
);

plannerNextDayButton.addEventListener(
  "click",
  () => {
    selectPlannerDate(
      addOfficeDays(selectedPlannerDate, 1)
    );
  }
);

plannerTodayButton.addEventListener(
  "click",
  () => {
    selectPlannerDate(plannerToday);
  }
);

plannerTomorrowButton.addEventListener(
  "click",
  () => {
    selectPlannerDate(plannerTomorrow);
  }
);

plannerDateInput.addEventListener(
  "change",
  () => {
    if (
      isValidOfficeDate(
        plannerDateInput.value
      )
    ) {
      selectPlannerDate(
        plannerDateInput.value
      );
    }
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
      const taskDate = taskDateInput.value;

      if (!isValidOfficeDate(taskDate)) {
        taskDateError.hidden = false;
        taskDateError.textContent =
          "Choose a valid Order date.";
        taskDateInput.focus();
        return;
      }

      if (taskDate < getLocalDateAtOffset(0)) {
        taskDateError.hidden = false;
        taskDateError.textContent =
          "Orders can only be prepared or rescheduled for today or a future date.";
        taskDateInput.focus();
        return;
      }

      taskDateError.hidden = true;
      taskDateError.textContent = "";

      const payload =
        await officeApiFetch(
          "/api/tasks",
          {
            method: editingTaskId
              ? "PUT"
              : "POST",

            body: JSON.stringify({
              id: editingTaskId,
              taskDate,
              title:
                taskTitleInput.value.trim(),
              description:
                taskDescriptionInput.value
                  .trim(),
              projectId:
                taskProjectInput.value ||
                null
            })
          }
        );

      closeTaskDialog();
      await refreshOrderPlanner();
      notifyChronicleOfOfficeRecordChange();
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
      notifyChronicleOfOfficeRecordChange();
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
