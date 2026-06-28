(() => {
  const departmentMap =
    window.MANOR_DEPARTMENT_MAP ?? {};

  const manorSettings =
    window.MANOR_SETTINGS ?? {
      currencyCode: "USD",
      locale: "en-US"
    };

  const reportView =
    document.querySelector(
      "#weekly-estate-report"
    );
  const previousButton =
    document.querySelector(
      "#weekly-report-previous"
    );
  const nextButton =
    document.querySelector(
      "#weekly-report-next"
    );
  const thisWeekButton =
    document.querySelector(
      "#weekly-report-this-week"
    );
  const refreshButton =
    document.querySelector(
      "#weekly-report-refresh"
    );
  const printButton =
    document.querySelector(
      "#weekly-report-print"
    );
  const dateInput =
    document.querySelector(
      "#weekly-report-date"
    );
  const statusElement =
    document.querySelector(
      "#weekly-report-status"
    );
  const rangeElement =
    document.querySelector(
      "#weekly-report-range"
    );
  const errorElement =
    document.querySelector(
      "#weekly-report-error"
    );
  const summaryElement =
    document.querySelector(
      "#weekly-report-summary"
    );
  const headlineElement =
    document.querySelector(
      "#weekly-report-headline"
    );
  const leadElement =
    document.querySelector(
      "#weekly-report-lead"
    );
  const highlightsElement =
    document.querySelector(
      "#weekly-report-highlights"
    );
  const dailyElement =
    document.querySelector(
      "#weekly-report-daily"
    );
  const departmentsElement =
    document.querySelector(
      "#weekly-report-departments"
    );
  const projectsElement =
    document.querySelector(
      "#weekly-report-projects"
    );
  const completedProjectsElement =
    document.querySelector(
      "#weekly-report-completed-projects"
    );
  const completedMilestonesElement =
    document.querySelector(
      "#weekly-report-completed-milestones"
    );
  const recentElement =
    document.querySelector(
      "#weekly-report-recent"
    );

  const requiredElements = [
    reportView,
    previousButton,
    nextButton,
    thisWeekButton,
    refreshButton,
    printButton,
    dateInput,
    statusElement,
    rangeElement,
    errorElement,
    summaryElement,
    headlineElement,
    leadElement,
    highlightsElement,
    dailyElement,
    departmentsElement,
    projectsElement,
    completedProjectsElement,
    completedMilestonesElement,
    recentElement
  ];

  if (
    requiredElements.some(
      element => !element
    )
  ) {
    console.error(
      "The Weekly Estate Report could not find its required page elements."
    );
    return;
  }

  const moneyFormatter =
    new Intl.NumberFormat(
      manorSettings.locale,
      {
        style: "currency",
        currency: manorSettings.currencyCode
      }
    );

  const dateFormatter =
    new Intl.DateTimeFormat(
      manorSettings.locale,
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    );

  const weekdayFormatter =
    new Intl.DateTimeFormat(
      manorSettings.locale,
      {
        weekday: "short"
      }
    );

  let todayDate = getLocalDateString();
  let selectedDate = todayDate;
  let lastReport = null;
  let requestSequence = 0;
  let activeController = null;

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

  function addDays(dateString, days) {
    const date = new Date(
      `${dateString}T00:00:00.000Z`
    );

    date.setUTCDate(
      date.getUTCDate() + days
    );

    return date.toISOString().slice(0, 10);
  }

  function getWeekStart(dateString) {
    const date = new Date(
      `${dateString}T00:00:00.000Z`
    );
    const daysSinceMonday =
      (date.getUTCDay() + 6) % 7;

    date.setUTCDate(
      date.getUTCDate() - daysSinceMonday
    );

    return date.toISOString().slice(0, 10);
  }

  function formatDate(dateString) {
    return dateFormatter.format(
      new Date(`${dateString}T00:00:00.000Z`)
    );
  }

  function formatWeekday(dateString) {
    return weekdayFormatter.format(
      new Date(`${dateString}T00:00:00.000Z`)
    );
  }

  function formatMoney(cents) {
    return moneyFormatter.format(
      Number(cents || 0) / 100
    );
  }

  function formatTime(minutes) {
    const value = Number(minutes || 0);

    if (value < 60) {
      return `${value} min`;
    }

    const hours = Math.floor(value / 60);
    const remaining = value % 60;

    if (remaining === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remaining} min`;
  }

  function pluralize(count, singular, plural) {
    return count === 1 ? singular : plural;
  }

  function createElement(
    tagName,
    className,
    text = ""
  ) {
    const element =
      document.createElement(tagName);

    if (className) {
      element.className = className;
    }

    if (text) {
      element.textContent = text;
    }

    return element;
  }

  function setError(message) {
    errorElement.hidden = !message;
    errorElement.textContent = message || "";
  }

  function isReportVisible() {
    return !reportView.closest("[hidden]");
  }

  function currentWeekStart() {
    todayDate = getLocalDateString();
    return getWeekStart(todayDate);
  }

  function selectedWeekStart() {
    return getWeekStart(selectedDate);
  }

  function setControlsLoading(loading) {
    const isCurrentWeek =
      selectedWeekStart() === currentWeekStart();

    previousButton.disabled = loading;
    nextButton.disabled =
      loading || isCurrentWeek;
    thisWeekButton.disabled =
      loading || isCurrentWeek;
    refreshButton.disabled = loading;
    dateInput.disabled = loading;
    printButton.disabled = loading || !lastReport;
    dateInput.max = todayDate;
    dateInput.value = selectedDate;
  }

  async function fetchReport(date, options = {}) {
    if (
      !isReportVisible() &&
      !options.force
    ) {
      return;
    }

    todayDate = getLocalDateString();

    if (!isValidDateString(date)) {
      setError(
        "Choose a valid report date."
      );
      dateInput.value = selectedDate;
      return;
    }

    if (
      getWeekStart(date) >
      getWeekStart(todayDate)
    ) {
      setError(
        "Choose this week or an earlier week."
      );
      dateInput.value = selectedDate;
      return;
    }

    selectedDate = date;
    const sequence = requestSequence + 1;
    requestSequence = sequence;

    if (activeController) {
      activeController.abort();
    }

    activeController =
      new AbortController();

    setControlsLoading(true);
    setError("");
    statusElement.textContent =
      "Opening the Weekly Estate Report...";

    try {
      const response = await fetch(
        `/api/weekly-report?date=${
          encodeURIComponent(date)
        }&today=${
          encodeURIComponent(todayDate)
        }`,
        {
          credentials: "same-origin",
          signal: activeController.signal
        }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ||
          "Could not open the Weekly Estate Report."
        );
      }

      if (sequence !== requestSequence) {
        return;
      }

      lastReport = payload;
      selectedDate = payload.date || date;
      renderReport(payload);
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      if (sequence !== requestSequence) {
        return;
      }

      setError(error.message);

      if (lastReport) {
        renderReport(lastReport);
      }
    } finally {
      if (sequence === requestSequence) {
        activeController = null;
        setControlsLoading(false);
      }
    }
  }

  function renderSummary(report) {
    const totals = report.totals ?? {};
    const cards = [
      [
        "Recorded Issues",
        String(totals.issues ?? 0)
      ],
      [
        "Recorded Time",
        formatTime(
          totals.durationMinutes ?? 0
        )
      ],
      [
        "Recorded Expenditure",
        formatMoney(
          totals.moneyCostCents ?? 0
        )
      ],
      [
        "Active Departments",
        String(
          totals.activeDepartments ?? 0
        )
      ],
      [
        "Completed Projects",
        String(
          totals.projectsCompleted ?? 0
        )
      ],
      [
        "Completed Milestones",
        String(
          totals.milestonesCompleted ?? 0
        )
      ]
    ];

    summaryElement.replaceChildren();

    for (const [label, value] of cards) {
      const card = createElement(
        "article",
        "weekly-report-summary-card"
      );
      card.append(
        createElement("p", "label", label),
        createElement("strong", "", value)
      );
      summaryElement.append(card);
    }
  }

  function renderHighlights(report) {
    const highlights =
      report.presentation?.highlights ?? [];

    highlightsElement.replaceChildren();

    if (highlights.length === 0) {
      highlightsElement.append(
        createElement(
          "p",
          "empty-state",
          "No notable highlights were recorded for this week."
        )
      );
      return;
    }

    for (const highlight of highlights) {
      highlightsElement.append(
        createElement(
          "article",
          "weekly-report-highlight",
          highlight
        )
      );
    }
  }

  function renderDaily(report) {
    dailyElement.replaceChildren();

    for (const day of report.daily ?? []) {
      const card = createElement(
        "article",
        day.included
          ? "weekly-report-day"
          : "weekly-report-day is-future"
      );
      const title = createElement(
        "h4",
        "",
        `${formatWeekday(day.date)}, ${formatDate(day.date)}`
      );

      if (!day.included) {
        card.append(
          title,
          createElement(
            "p",
            "weekly-report-muted",
            "Not yet reported"
          )
        );
      } else {
        card.append(
          title,
          createElement(
            "p",
            "",
            `${day.issueCount} ${pluralize(day.issueCount, "Issue", "Issues")}`
          ),
          createElement(
            "p",
            "",
            formatTime(day.durationMinutes)
          ),
          createElement(
            "p",
            "",
            formatMoney(day.moneyCostCents)
          )
        );
      }

      dailyElement.append(card);
    }
  }

  function renderMetricList(
    container,
    records,
    emptyText,
    createRecord
  ) {
    container.replaceChildren();

    if (!records || records.length === 0) {
      container.append(
        createElement(
          "p",
          "empty-state",
          emptyText
        )
      );
      return;
    }

    for (const record of records) {
      container.append(
        createRecord(record)
      );
    }
  }

  function metricRecord(title, lines) {
    const card = createElement(
      "article",
      "weekly-report-record"
    );
    card.append(
      createElement("h4", "", title)
    );

    for (const line of lines) {
      if (line) {
        card.append(
          createElement("p", "", line)
        );
      }
    }

    return card;
  }

  function renderDepartments(report) {
    renderMetricList(
      departmentsElement,
      report.departments,
      "No department activity was recorded for this week.",
      department =>
        metricRecord(department.name, [
          `${department.issueCount} ${pluralize(department.issueCount, "Issue", "Issues")}`,
          formatTime(department.durationMinutes),
          formatMoney(department.moneyCostCents)
        ])
    );
  }

  function renderProjects(report) {
    renderMetricList(
      projectsElement,
      report.projects,
      "No recorded Issues were linked to projects this week.",
      project => {
        const department =
          departmentMap[project.region];

        return metricRecord(project.name, [
          department?.name || project.region,
          `${project.issueCount} ${pluralize(project.issueCount, "Issue", "Issues")}`,
          formatTime(project.durationMinutes),
          formatMoney(project.moneyCostCents)
        ]);
      }
    );
  }

  function renderCouncil(report) {
    renderMetricList(
      completedProjectsElement,
      report.completedProjects,
      "No projects were completed during this report range.",
      project => {
        const department =
          departmentMap[project.region];

        return metricRecord(project.name, [
          "Completed project",
          department?.name || project.region,
          project.completedAt
            ? `Completed ${formatDate(project.completedAt.slice(0, 10))}`
            : ""
        ]);
      }
    );

    renderMetricList(
      completedMilestonesElement,
      report.completedMilestones,
      "No milestones were completed during this report range.",
      milestone =>
        metricRecord(milestone.title, [
          "Completed milestone",
          milestone.projectName
            ? `Project: ${milestone.projectName}`
            : "",
          milestone.completedAt
            ? `Completed ${formatDate(milestone.completedAt.slice(0, 10))}`
            : "",
          milestone.notes || ""
        ])
    );
  }

  function renderRecent(report) {
    renderMetricList(
      recentElement,
      report.recentIssues,
      "No recent records were available for this week.",
      issue => {
        const department =
          departmentMap[issue.region];
        const details = [
          `${formatDate(issue.date)} · ${department?.name || issue.region}`,
          issue.projectName
            ? `Project: ${issue.projectName}`
            : "",
          issue.description || "",
          [
            issue.durationMinutes
              ? formatTime(
                  issue.durationMinutes
                )
              : "",
            issue.moneyCostCents
              ? formatMoney(
                  issue.moneyCostCents
                )
              : ""
          ]
            .filter(Boolean)
            .join(" · ")
        ];

        return metricRecord(
          issue.title,
          details
        );
      }
    );
  }

  function renderReport(report) {
    const statusText =
      report.status === "complete"
        ? "Complete Week"
        : "Week in Progress";

    statusElement.textContent =
      statusText;
    rangeElement.textContent =
      `${formatDate(report.weekStart)} - ${formatDate(report.weekEnd)}`;
    headlineElement.textContent =
      report.presentation?.headline ||
      "A Quiet Week Across the Manor";
    leadElement.textContent =
      report.presentation?.lead || "";
    selectedDate = report.date;

    renderSummary(report);
    renderHighlights(report);
    renderDaily(report);
    renderDepartments(report);
    renderProjects(report);
    renderCouncil(report);
    renderRecent(report);
    setControlsLoading(false);
  }

  function refreshVisibleReport() {
    if (!isReportVisible()) {
      return Promise.resolve();
    }

    return fetchReport(selectedDate);
  }

  previousButton.addEventListener(
    "click",
    () => {
      fetchReport(
        addDays(selectedWeekStart(), -7)
      ).catch(console.error);
    }
  );

  nextButton.addEventListener(
    "click",
    () => {
      const nextWeek =
        addDays(selectedWeekStart(), 7);

      if (nextWeek <= currentWeekStart()) {
        fetchReport(nextWeek).catch(
          console.error
        );
      }
    }
  );

  thisWeekButton.addEventListener(
    "click",
    () => {
      todayDate = getLocalDateString();
      fetchReport(todayDate).catch(
        console.error
      );
    }
  );

  refreshButton.addEventListener(
    "click",
    () => {
      fetchReport(selectedDate).catch(
        console.error
      );
    }
  );

  dateInput.addEventListener(
    "change",
    () => {
      const value = dateInput.value;

      if (
        !isValidDateString(value) ||
        getWeekStart(value) >
          currentWeekStart()
      ) {
        setError(
          "Choose this week or an earlier valid date."
        );
        dateInput.value = selectedDate;
        return;
      }

      fetchReport(value).catch(
        console.error
      );
    }
  );

  printButton.addEventListener(
    "click",
    () => {
      window.print();
    }
  );

  window.refreshWeeklyEstateReport =
    refreshVisibleReport;

  todayDate = getLocalDateString();
  dateInput.max = todayDate;
  setControlsLoading(false);
})();
