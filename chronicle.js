(() => {
  const departments =
    window.MANOR_DEPARTMENT_MAP ?? {};

  const manorEvents =
    window.Manor?.events;

  const manorApplication =
    document.querySelector(
      "#manor-application"
    );

  const currentDateElement =
    document.querySelector("#current-date");

  const headlineElement =
    document.querySelector(
      "#chronicle-headline"
    );

  const leadElement =
    document.querySelector(
      "#chronicle-lead"
    );

  const taskList =
    document.querySelector(
      "#chronicle-task-list"
    );

  const issueList =
    document.querySelector(
      "#chronicle-issue-list"
    );

  const milestoneList =
    document.querySelector(
      "#chronicle-milestone-list"
    );

  const refreshButton =
    document.querySelector(
      "#refresh-chronicle-button"
    );

  const previousDayButton =
    document.querySelector(
      "#chronicle-previous-day"
    );

  const nextDayButton =
    document.querySelector(
      "#chronicle-next-day"
    );

  const todayButton =
    document.querySelector(
      "#chronicle-today-button"
    );

  const dateInput =
    document.querySelector(
      "#chronicle-date-input"
    );

  const sealButton =
    document.querySelector(
      "#seal-chronicle-edition"
    );

  const regenerateButton =
    document.querySelector(
      "#regenerate-chronicle-edition"
    );

  const archiveSelect =
    document.querySelector(
      "#chronicle-edition-select"
    );

  const archiveEmpty =
    document.querySelector(
      "#chronicle-archive-empty"
    );

  const editionStatus =
    document.querySelector(
      "#chronicle-edition-status"
    );

  const editionDetail =
    document.querySelector(
      "#chronicle-edition-detail"
    );

  const editionError =
    document.querySelector(
      "#chronicle-edition-error"
    );

  const ordersHeading =
    document.querySelector(
      "#chronicle-orders-heading"
    );

  const recordHeading =
    document.querySelector(
      "#chronicle-record-heading"
    );

  const requiredElements = [
    manorApplication,
    currentDateElement,
    headlineElement,
    leadElement,
    taskList,
    issueList,
    milestoneList,
    refreshButton,
    previousDayButton,
    nextDayButton,
    todayButton,
    dateInput,
    sealButton,
    regenerateButton,
    archiveSelect,
    archiveEmpty,
    editionStatus,
    editionDetail,
    editionError,
    ordersHeading,
    recordHeading
  ];

  if (
    requiredElements.some(
      element => !element
    )
  ) {
    console.error(
      "The Manor Chronicle could not find its required page elements."
    );

    return;
  }

  const STORAGE_UNAVAILABLE_CODE =
    "CHRONICLE_EDITION_STORAGE_UNAVAILABLE";

  let selectedDate = getLocalDateString();
  let todayDate = selectedDate;
  let currentMode = "loading";
  let archiveEditions = [];
  let storageAvailable = true;
  let requestSequence = 0;

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

  function addDays(dateString, days) {
    const date = new Date(
      `${dateString}T00:00:00.000Z`
    );

    date.setUTCDate(
      date.getUTCDate() + days
    );

    return date.toISOString().slice(0, 10);
  }

  function isValidDateString(value) {
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

  function formatDate(
    dateString,
    options = null
  ) {
    if (!dateString) {
      return "";
    }

    const date = new Date(
      `${dateString}T12:00:00`
    );

    return new Intl.DateTimeFormat(
      "en-US",
      options ?? {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    ).format(date);
  }

  function formatTimestamp(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    ).format(date);
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
      credentials: "same-origin",
      cache: "no-store"
    });

    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const error = new Error(
        payload?.error ||
        `The server returned status ${response.status}.`
      );

      error.status = response.status;
      error.code = payload?.code || null;
      error.payload = payload;

      throw error;
    }

    return payload;
  }

  function createElement(
    tag,
    className,
    text
  ) {
    const element =
      document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }

  function defaultStatistics() {
    return {
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
    };
  }

  function normalizeCount(value) {
    const number = Number(value);

    return Number.isFinite(number)
      ? Math.max(
          0,
          Math.trunc(number)
        )
      : 0;
  }

  function normalizeStatistics(
    statistics
  ) {
    const defaults =
      defaultStatistics();

    return {
      orders: {
        total:
          normalizeCount(
            statistics?.orders?.total ??
            defaults.orders.total
          ),
        pending:
          normalizeCount(
            statistics?.orders?.pending ??
            defaults.orders.pending
          ),
        completed:
          normalizeCount(
            statistics?.orders?.completed ??
            defaults.orders.completed
          )
      },
      issues: {
        total:
          normalizeCount(
            statistics?.issues?.total ??
            defaults.issues.total
          ),
        durationMinutes:
          normalizeCount(
            statistics?.issues
              ?.durationMinutes ??
            defaults.issues.durationMinutes
          ),
        moneyCostCents:
          normalizeCount(
            statistics?.issues
              ?.moneyCostCents ??
            defaults.issues.moneyCostCents
          )
      },
      milestones: {
        total:
          normalizeCount(
            statistics?.milestones?.total ??
            defaults.milestones.total
          ),
        overdue:
          normalizeCount(
            statistics?.milestones?.overdue ??
            defaults.milestones.overdue
          ),
        dueToday:
          normalizeCount(
            statistics?.milestones?.dueToday ??
            defaults.milestones.dueToday
          ),
        dueSoon:
          normalizeCount(
            statistics?.milestones?.dueSoon ??
            defaults.milestones.dueSoon
          )
      }
    };
  }

  function fallbackPresentation(
    statistics
  ) {
    if (statistics.orders.total > 0) {
      return {
        headline:
          `${statistics.orders.total} ${
            statistics.orders.total === 1
              ? "Order Awaits"
              : "Orders Await"
          } Attention`
      };
    }

    if (statistics.issues.total > 0) {
      return {
        headline:
          `${statistics.issues.total} ${
            statistics.issues.total === 1
              ? "Affair Enters"
              : "Affairs Enter"
          } Today's Record`
      };
    }

    if (statistics.milestones.total > 0) {
      return {
        headline:
          "Council Deadlines Approach"
      };
    }

    return {
      headline:
        "A Quiet Morning Across the Manor"
    };
  }

  function normalizePayload(payload) {
    const statistics =
      normalizeStatistics(
        payload?.statistics
      );

    const presentation = {
      ...fallbackPresentation(
        statistics
      ),
      ...(payload?.presentation || {})
    };

    if (!presentation.lead) {
      presentation.lead =
        `Today's dispatch contains ${
          statistics.orders.total
        } ${
          statistics.orders.total === 1
            ? "order"
            : "orders"
        }, ${statistics.issues.total} ${
          statistics.issues.total === 1
            ? "recorded affair"
            : "recorded affairs"
        }, and ${statistics.milestones.total} ${
          statistics.milestones.total === 1
            ? "milestone"
            : "milestones"
        } overdue or due within the next seven days.`;
    }

    return {
      date:
        payload?.date || selectedDate,
      horizonDate:
        payload?.horizonDate || "",
      presentation,
      orders:
        Array.isArray(payload?.orders)
          ? payload.orders
          : [],
      issues:
        Array.isArray(payload?.issues)
          ? payload.issues
          : [],
      milestones:
        Array.isArray(payload?.milestones)
          ? payload.milestones
          : [],
      statistics,
      formatVersion:
        payload?.formatVersion || 1,
      sealedAt: payload?.sealedAt || null,
      updatedAt: payload?.updatedAt || null
    };
  }

  function appendEntry(
    list,
    meta,
    title,
    description = ""
  ) {
    const entry = createElement(
      "article",
      "chronicle-entry"
    );

    if (meta) {
      entry.append(
        createElement(
          "p",
          "chronicle-entry-meta",
          meta
        )
      );
    }

    entry.append(
      createElement(
        "h5",
        "chronicle-entry-title",
        title
      )
    );

    if (description) {
      entry.append(
        createElement(
          "p",
          "chronicle-entry-description",
          description
        )
      );
    }

    list.append(entry);
  }

  function renderTasks(
    tasks,
    date,
    formatVersion
  ) {
    taskList.replaceChildren();

    if (tasks.length === 0) {
      taskList.append(
        createElement(
          "p",
          "chronicle-empty",
          date === todayDate
            ? "No Orders remain for today."
            : "No Orders remained for this date."
        )
      );

      return;
    }

    for (const task of tasks) {
      const metaParts = [];

      if (formatVersion < 2) {
        metaParts.push(
          task.completed
            ? "Completed"
            : "Pending"
        );
      }

      if (task.projectName) {
        metaParts.push(
          task.projectName
        );
      }

      appendEntry(
        taskList,
        metaParts.join(" · "),
        task.title,
        task.description || ""
      );
    }
  }

  function renderIssues(issues, date) {
    issueList.replaceChildren();

    if (issues.length === 0) {
      issueList.append(
        createElement(
          "p",
          "chronicle-empty",
          date === todayDate
            ? "No affairs have yet been entered today."
            : "No affairs were entered for this date."
        )
      );

      return;
    }

    for (const issue of issues) {
      const department =
        departments[issue.region];

      const metaParts = [
        department?.shortName ||
        department?.name ||
        "Manor Record"
      ];

      if (
        issue.duration !== null &&
        issue.duration !== undefined
      ) {
        metaParts.push(
          `${issue.duration} min`
        );
      }

      appendEntry(
        issueList,
        metaParts.join(" · "),
        issue.title,
        issue.description || ""
      );
    }
  }

  function renderMilestones(
    milestones,
    date
  ) {
    milestoneList.replaceChildren();

    if (milestones.length === 0) {
      milestoneList.append(
        createElement(
          "p",
          "chronicle-empty",
          "No overdue or near-term milestones require attention."
        )
      );

      return;
    }

    for (const milestone of milestones) {
      const timing =
        milestone.targetDate < date
          ? "Overdue"
          : `Due ${formatDate(
              milestone.targetDate,
              {
                month: "short",
                day: "numeric"
              }
            )}`;

      const metaParts = [timing];

      if (milestone.projectName) {
        metaParts.push(
          milestone.projectName
        );
      }

      appendEntry(
        milestoneList,
        metaParts.join(" · "),
        milestone.title,
        milestone.notes || ""
      );
    }
  }

  function setError(message) {
    editionError.hidden = !message;
    editionError.textContent = message || "";
  }

  function setButtonState() {
    const isToday =
      selectedDate === todayDate;

    previousDayButton.disabled =
      currentMode === "loading";

    nextDayButton.disabled =
      currentMode === "loading" ||
      isToday;

    todayButton.disabled =
      currentMode === "loading" ||
      isToday;

    dateInput.max = todayDate;
    dateInput.value = selectedDate;

    refreshButton.disabled =
      currentMode === "loading" ||
      currentMode === "sealed";

    sealButton.disabled =
      currentMode !== "live" ||
      !storageAvailable;

    regenerateButton.disabled =
      currentMode !== "sealed" ||
      !storageAvailable;

    archiveSelect.disabled =
      !storageAvailable ||
      archiveEditions.length === 0;
  }

  function renderArchive() {
    archiveSelect.replaceChildren();

    if (
      !storageAvailable ||
      archiveEditions.length === 0
    ) {
      const option =
        document.createElement("option");

      option.value = "";
      option.textContent =
        storageAvailable
          ? "No sealed editions"
          : "Storage unavailable";

      archiveSelect.append(option);
      archiveEmpty.hidden = false;
      archiveEmpty.textContent =
        storageAvailable
          ? "No editions have been sealed yet."
          : "Permanent edition storage is unavailable.";

      return;
    }

    archiveEmpty.hidden = true;

    const placeholder =
      document.createElement("option");

    placeholder.value = "";
    placeholder.textContent =
      "Choose a sealed edition";

    archiveSelect.append(placeholder);

    for (const edition of archiveEditions) {
      const option =
        document.createElement("option");

      option.value = edition.date;
      option.textContent =
        `${formatDate(edition.date)} — ${
          edition.headline
        }`;

      archiveSelect.append(option);
    }

    archiveSelect.value =
      archiveEditions.some(
        edition =>
          edition.date === selectedDate
      )
        ? selectedDate
        : "";
  }

  function renderStatus(payload) {
    if (!storageAvailable) {
      editionStatus.textContent =
        "Permanent Storage Unavailable";

      editionDetail.textContent =
        "Showing a live reconstruction. Apply the Chronicle editions migration to seal permanent snapshots.";

      return;
    }

    if (currentMode === "sealed") {
      editionStatus.textContent =
        "Sealed Edition";

      const sealedAt =
        formatTimestamp(payload.sealedAt);

      const updatedAt =
        formatTimestamp(payload.updatedAt);

      editionDetail.textContent =
        `Edition date: ${
          formatDate(payload.date)
        }. Sealed: ${
          sealedAt || "unknown"
        }${
          updatedAt && updatedAt !== sealedAt
            ? `. Last regenerated: ${updatedAt}`
            : ""
        }.`;

      return;
    }

    if (currentMode === "live") {
      editionStatus.textContent =
        "Unsealed Reconstruction";

      editionDetail.textContent =
        `Edition date: ${
          formatDate(payload.date)
        }. This preview is rebuilt from live manor records and has not been sealed.`;

      return;
    }

    editionStatus.textContent =
      "Opening Chronicle...";

    editionDetail.textContent = "";
  }

  function renderChronicle(
    payload,
    mode
  ) {
    const normalized =
      normalizePayload(payload);

    currentMode = mode;

    const historical =
      normalized.date !== todayDate;

    ordersHeading.textContent =
      historical
        ? "Orders of the Day"
        : "Today’s Orders";

    recordHeading.textContent =
      historical
        ? "Record of the Day"
        : "Today’s Record";

    currentDateElement.textContent =
      formatDate(
        normalized.date,
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }
      );

    headlineElement.textContent =
      normalized.presentation.headline;

    leadElement.textContent =
      normalized.presentation.lead;

    renderTasks(
      normalized.orders,
      normalized.date,
      normalized.formatVersion
    );

    renderIssues(
      normalized.issues,
      normalized.date
    );

    renderMilestones(
      normalized.milestones,
      normalized.date
    );

    renderStatus(normalized);
    renderArchive();
    setButtonState();
  }

  async function loadArchive() {
    if (!storageAvailable) {
      renderArchive();
      return;
    }

    try {
      const payload =
        await apiFetch(
          "/api/chronicle-editions"
        );

      archiveEditions =
        Array.isArray(payload?.editions)
          ? payload.editions
          : [];

      renderArchive();
    } catch (error) {
      if (
        error.code ===
        STORAGE_UNAVAILABLE_CODE
      ) {
        storageAvailable = false;
        archiveEditions = [];
        renderArchive();
        return;
      }

      throw error;
    }
  }

  async function loadLive(
    date,
    sequence
  ) {
    const payload =
      await apiFetch(
        `/api/chronicle?date=${
          encodeURIComponent(date)
        }`
      );

    if (sequence !== requestSequence) {
      return;
    }

    renderChronicle(payload, "live");
  }

  async function loadEditionOrLive(
    date,
    { forceLive = false } = {}
  ) {
    if (
      !isValidDateString(date) ||
      date > todayDate
    ) {
      return;
    }

    const sequence =
      requestSequence + 1;

    requestSequence = sequence;
    selectedDate = date;
    currentMode = "loading";
    setError("");
    setButtonState();

    try {
      if (!forceLive) {
        await loadArchive();
      }

      if (
        storageAvailable &&
        !forceLive
      ) {
        try {
          const payload =
            await apiFetch(
              `/api/chronicle-editions?date=${
                encodeURIComponent(date)
              }`
            );

          if (
            sequence !== requestSequence
          ) {
            return;
          }

          renderChronicle(
            payload.edition,
            "sealed"
          );
          return;
        } catch (error) {
          if (error.status !== 404) {
            if (
              error.code ===
              STORAGE_UNAVAILABLE_CODE
            ) {
              storageAvailable = false;
              archiveEditions = [];
            } else {
              throw error;
            }
          }
        }
      }

      await loadLive(date, sequence);
    } catch (error) {
      if (sequence !== requestSequence) {
        return;
      }

      headlineElement.textContent =
        "The Morning Dispatch Could Not Be Opened";

      leadElement.textContent =
        error.message;

      taskList.replaceChildren();
      issueList.replaceChildren();
      milestoneList.replaceChildren();

      currentMode = "error";
      setError(error.message);
      setButtonState();
    }
  }

  function cancelPendingChronicleLoads() {
    requestSequence += 1;
  }

  function refreshLiveChronicleForChange() {
    if (currentMode !== "live") {
      return;
    }

    loadEditionOrLive(
      selectedDate,
      {
        forceLive: true
      }
    ).catch(console.error);
  }

  async function refreshPreview() {
    cancelPendingChronicleLoads();
    refreshButton.disabled = true;
    refreshButton.textContent =
      "Opening Preview...";

    try {
      await loadEditionOrLive(
        selectedDate,
        {
          forceLive: true
        }
      );
    } finally {
      refreshButton.textContent =
        "Refresh Preview";
      setButtonState();
    }
  }

  async function sealEdition() {
    const previousMode = currentMode;

    cancelPendingChronicleLoads();
    currentMode = "loading";
    sealButton.disabled = true;
    sealButton.textContent =
      "Sealing...";
    setButtonState();

    try {
      const payload =
        await apiFetch(
          "/api/chronicle-editions",
          {
            method: "POST",
            body: JSON.stringify({
              date: selectedDate
            })
          }
        );

      await loadArchive();
      renderChronicle(
        payload.edition,
        "sealed"
      );
      setError("");
    } catch (error) {
      currentMode = previousMode;
      setError(error.message);
    } finally {
      sealButton.textContent =
        "Seal Edition";
      setButtonState();
    }
  }

  async function regenerateEdition() {
    const confirmed = window.confirm(
      "Regenerate this sealed Chronicle edition from the current manor records?"
    );

    if (!confirmed) {
      return;
    }

    const previousMode = currentMode;

    cancelPendingChronicleLoads();
    currentMode = "loading";
    regenerateButton.disabled = true;
    regenerateButton.textContent =
      "Regenerating...";
    setButtonState();

    try {
      const payload =
        await apiFetch(
          "/api/chronicle-editions",
          {
            method: "PUT",
            body: JSON.stringify({
              date: selectedDate
            })
          }
        );

      await loadArchive();
      renderChronicle(
        payload.edition,
        "sealed"
      );
      setError("");
    } catch (error) {
      currentMode = previousMode;
      setError(error.message);
    } finally {
      regenerateButton.textContent =
        "Regenerate Edition";
      setButtonState();
    }
  }

  function initializeChronicle() {
    todayDate = getLocalDateString();
    dateInput.max = todayDate;

    if (
      !isValidDateString(selectedDate) ||
      selectedDate > todayDate
    ) {
      selectedDate = todayDate;
    }

    loadEditionOrLive(
      selectedDate
    ).catch(console.error);
  }

  previousDayButton.addEventListener(
    "click",
    () => {
      loadEditionOrLive(
        addDays(selectedDate, -1)
      ).catch(console.error);
    }
  );

  nextDayButton.addEventListener(
    "click",
    () => {
      const nextDate =
        addDays(selectedDate, 1);

      if (nextDate <= todayDate) {
        loadEditionOrLive(
          nextDate
        ).catch(console.error);
      }
    }
  );

  todayButton.addEventListener(
    "click",
    () => {
      todayDate = getLocalDateString();

      loadEditionOrLive(
        todayDate
      ).catch(console.error);
    }
  );

  dateInput.addEventListener(
    "change",
    () => {
      const nextDate =
        dateInput.value;

      if (
        !isValidDateString(nextDate) ||
        nextDate > todayDate
      ) {
        dateInput.value = selectedDate;
        setError(
          "Choose today or an earlier valid date."
        );
        return;
      }

      loadEditionOrLive(
        nextDate
      ).catch(console.error);
    }
  );

  archiveSelect.addEventListener(
    "change",
    () => {
      if (archiveSelect.value) {
        loadEditionOrLive(
          archiveSelect.value
        ).catch(console.error);
      }
    }
  );

  refreshButton.addEventListener(
    "click",
    () => {
      if (currentMode === "live") {
        refreshPreview().catch(error => {
          setError(error.message);
        });
      }
    }
  );

  sealButton.addEventListener(
    "click",
    () => {
      sealEdition().catch(error => {
        setError(error.message);
      });
    }
  );

  regenerateButton.addEventListener(
    "click",
    () => {
      regenerateEdition().catch(error => {
        setError(error.message);
      });
    }
  );

  const applicationObserver =
    new MutationObserver(() => {
      if (!manorApplication.hidden) {
        initializeChronicle();
      }
    });

  applicationObserver.observe(
    manorApplication,
    {
      attributes: true,
      attributeFilter: ["hidden"]
    }
  );

  setButtonState();

  for (const eventName of [
    manorEvents?.names.ISSUE_CHANGED,
    manorEvents?.names.PROJECT_CHANGED,
    manorEvents?.names.MILESTONE_CHANGED,
    manorEvents?.names.ORDER_CHANGED
  ]) {
    if (eventName) {
      manorEvents.on(
        eventName,
        refreshLiveChronicleForChange
      );
    }
  }

  if (window.Manor?.features) {
    window.Manor.features.chronicle =
      Object.freeze({
        refresh:
          () => loadEditionOrLive(selectedDate),
        refreshLiveForChange:
          refreshLiveChronicleForChange
      });
  }

  // Compatibility shim for older callers. New cross-feature refreshes use Manor events.
  window.refreshManorChronicle =
    () => loadEditionOrLive(
      selectedDate
    );
})();
