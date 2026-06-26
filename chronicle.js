(() => {
  const departments =
    window.MANOR_DEPARTMENT_MAP ?? {};

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

  const recentIssueList =
    document.querySelector(
      "#recent-issue-list"
    );

  const officeTaskList =
    document.querySelector(
      "#tomorrow-task-list"
    );

  const officeMilestoneList =
    document.querySelector(
      "#milestone-list"
    );

  const requiredElements = [
    manorApplication,
    currentDateElement,
    headlineElement,
    leadElement,
    taskList,
    issueList,
    milestoneList,
    refreshButton
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

  let refreshTimer = null;
  let refreshInProgress = false;
  let refreshRequested = false;

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
      `${dateString}T12:00:00`
    );

    date.setDate(
      date.getDate() + days
    );

    const timezoneOffset =
      date.getTimezoneOffset() * 60_000;

    return new Date(
      date.getTime() - timezoneOffset
    )
      .toISOString()
      .slice(0, 10);
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

  async function chronicleFetch(path) {
    const response = await fetch(path, {
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
      throw new Error(
        payload?.error ||
        `The server returned status ${response.status}.`
      );
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

    entry.append(
      createElement(
        "p",
        "chronicle-entry-meta",
        meta
      ),
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

  function renderTasks(tasks) {
    taskList.replaceChildren();

    if (tasks.length === 0) {
      taskList.append(
        createElement(
          "p",
          "chronicle-empty",
          "No orders were prepared for today."
        )
      );

      return;
    }

    const orderedTasks =
      [...tasks].sort(
        (first, second) => {
          const completionDifference =
            Number(first.completed) -
            Number(second.completed);

          if (completionDifference !== 0) {
            return completionDifference;
          }

          return String(
            first.createdAt ?? ""
          ).localeCompare(
            String(
              second.createdAt ?? ""
            )
          );
        }
      );

    for (const task of orderedTasks) {
      const metaParts = [
        task.completed
          ? "Completed"
          : "Pending"
      ];

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

  function renderIssues(issues) {
    issueList.replaceChildren();

    if (issues.length === 0) {
      issueList.append(
        createElement(
          "p",
          "chronicle-empty",
          "No affairs have yet been entered today."
        )
      );

      return;
    }

    const orderedIssues =
      [...issues]
        .sort((first, second) =>
          String(
            second.createdAt ?? ""
          ).localeCompare(
            String(
              first.createdAt ?? ""
            )
          )
        )
        .slice(0, 5);

    for (const issue of orderedIssues) {
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
    today
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
        milestone.targetDate < today
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

  function setHeadline(
    tasks,
    issues,
    milestones
  ) {
    const pendingTasks =
      tasks.filter(
        task => !task.completed
      );

    if (pendingTasks.length > 0) {
      headlineElement.textContent =
        `${pendingTasks.length} ${
          pendingTasks.length === 1
            ? "Order Awaits"
            : "Orders Await"
        } Attention`;
    } else if (issues.length > 0) {
      headlineElement.textContent =
        `${issues.length} ${
          issues.length === 1
            ? "Affair Enters"
            : "Affairs Enter"
        } Today's Record`;
    } else if (milestones.length > 0) {
      headlineElement.textContent =
        "Council Deadlines Approach";
    } else {
      headlineElement.textContent =
        "A Quiet Morning Across the Manor";
    }

    const completedTasks =
      tasks.length -
      pendingTasks.length;

    leadElement.textContent =
      `Today's dispatch contains ${
        tasks.length
      } ${
        tasks.length === 1
          ? "order"
          : "orders"
      } (${pendingTasks.length} pending and ${
        completedTasks
      } completed), ${issues.length} ${
        issues.length === 1
          ? "recorded affair"
          : "recorded affairs"
      }, and ${milestones.length} ${
        milestones.length === 1
          ? "milestone"
          : "milestones"
      } overdue or due within the next seven days.`;
  }

  async function refreshChronicle() {
    if (
      !manorApplication ||
      manorApplication.hidden
    ) {
      return;
    }

    if (refreshInProgress) {
      refreshRequested = true;
      return;
    }

    refreshInProgress = true;
    refreshRequested = false;

    refreshButton.disabled = true;
    refreshButton.textContent =
      "Opening Dispatch...";

    const today =
      getLocalDateString();

    const horizon =
      addDays(today, 7);

    currentDateElement.textContent =
      formatDate(
        today,
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }
      );

    try {
      const [
        taskPayload,
        issuePayload,
        milestonePayload
      ] = await Promise.all([
        chronicleFetch(
          `/api/tasks?date=${
            encodeURIComponent(today)
          }`
        ),

        chronicleFetch(
          "/api/issues"
        ),

        chronicleFetch(
          "/api/milestones"
        )
      ]);

      const tasks =
        taskPayload.tasks ?? [];

      const todayIssues =
        (issuePayload.issues ?? [])
          .filter(
            issue =>
              issue.date === today
          );

      const watchedMilestones =
        (
          milestonePayload.milestones ??
          []
        )
          .filter(
            milestone =>
              !milestone.completed &&
              milestone.targetDate <=
                horizon
          )
          .sort(
            (first, second) =>
              first.targetDate
                .localeCompare(
                  second.targetDate
                )
          )
          .slice(0, 5);

      setHeadline(
        tasks,
        todayIssues,
        watchedMilestones
      );

      renderTasks(tasks);
      renderIssues(todayIssues);

      renderMilestones(
        watchedMilestones,
        today
      );
    } catch (error) {
      headlineElement.textContent =
        "The Morning Dispatch Could Not Be Opened";

      leadElement.textContent =
        error.message;

      taskList.replaceChildren();
      issueList.replaceChildren();
      milestoneList.replaceChildren();
    } finally {
      refreshButton.disabled = false;

      refreshButton.textContent =
        "Refresh Dispatch";

      refreshInProgress = false;

      if (refreshRequested) {
        scheduleRefresh();
      }
    }
  }

  function scheduleRefresh() {
    window.clearTimeout(
      refreshTimer
    );

    refreshTimer =
      window.setTimeout(
        () => {
          refreshChronicle().catch(
            console.error
          );
        },
        120
      );
  }

  refreshButton.addEventListener(
    "click",
    () => {
      refreshChronicle().catch(
        error => {
          window.alert(
            error.message
          );
        }
      );
    }
  );

  const applicationObserver =
    new MutationObserver(() => {
      if (!manorApplication.hidden) {
        scheduleRefresh();
      }
    });

  applicationObserver.observe(
    manorApplication,
    {
      attributes: true,
      attributeFilter: ["hidden"]
    }
  );

  const contentObserver =
    new MutationObserver(
      scheduleRefresh
    );

  for (const element of [
    recentIssueList,
    officeTaskList,
    officeMilestoneList
  ]) {
    if (element) {
      contentObserver.observe(
        element,
        {
          childList: true,
          subtree: true
        }
      );
    }
  }

  window.refreshManorChronicle =
    refreshChronicle;
})();
