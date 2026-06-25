const LEGACY_STORAGE_KEY = "lord-manor-issues-v1";
const MIGRATION_STORAGE_KEY = "lord-manor-d1-migration-v1";

const regionNames = {
  laboratory: "The Laboratory",
  academy: "The Academy",
  "great-hall": "The Great Hall",
  "map-room": "The Map Room",
  "training-ground": "The Training Ground",
  gallery: "The Gallery",
  "council-chamber": "The Council Chamber"
};

const dateElement = document.querySelector("#current-date");
const recordButton = document.querySelector("#record-button");
const issueDialog = document.querySelector("#issue-dialog");
const issueForm = document.querySelector("#issue-form");
const closeDialogButton = document.querySelector("#close-dialog");
const cancelIssueButton = document.querySelector("#cancel-issue");

const issueDateInput = document.querySelector("#issue-date");
const issueRegionInput = document.querySelector("#issue-region");
const issueTitleInput = document.querySelector("#issue-title");
const issueDescriptionInput = document.querySelector(
  "#issue-description"
);
const issueDurationInput = document.querySelector("#issue-duration");

const issueList = document.querySelector("#issue-list");
const emptyIssues = document.querySelector("#empty-issues");

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

let issues = [];

const today = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
}).format(new Date());

dateElement.textContent = today;

function getLocalDateString() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset)
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

  const response = await fetch(
    "/api/auth/login",
    {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password: loginPasswordInput.value
      })
    }
  );

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  
  if (!response.ok) {
    throw new Error(
      payload?.error ||
      `Login failed with status ${response.status}.`
    );
  }

  return payload;
}

function formatIssueDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function createTextElement(
  tag,
  className,
  text
) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  element.textContent = text;

  return element;
}

function renderIssues() {
  issueList.replaceChildren();

  const sortedIssues = [...issues].sort(
    (first, second) => {
      const firstTime =
        `${first.date}-${first.createdAt}`;

      const secondTime =
        `${second.date}-${second.createdAt}`;

      return secondTime.localeCompare(firstTime);
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
    const card = document.createElement("article");
    card.className = "issue-card";

    const header = document.createElement("div");
    header.className = "issue-card-header";

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
      `${formatIssueDate(issue.date)}` +
      durationText
    );

    const title = createTextElement(
      "h3",
      "",
      issue.title
    );

    headingContainer.append(meta, title);

    const deleteButton = createTextElement(
      "button",
      "delete-button",
      "Delete"
    );

    deleteButton.type = "button";

    deleteButton.addEventListener(
      "click",
      async () => {
        const confirmed = window.confirm(
          `Delete the issue “${issue.title}”?`
        );

        if (!confirmed) {
          return;
        }

        deleteButton.disabled = true;
        deleteButton.textContent = "Deleting...";

        try {
          await apiFetch(
            `/api/issues?id=${encodeURIComponent(
              issue.id
            )}`,
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
          deleteButton.textContent = "Delete";
        }
      }
    );

    header.append(
      headingContainer,
      deleteButton
    );

    card.append(header);

    if (issue.description) {
      const description = createTextElement(
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

function readLegacyIssues() {
  try {
    const storedValue = localStorage.getItem(
      LEGACY_STORAGE_KEY
    );

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

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

  const legacyIssues = readLegacyIssues();

  if (legacyIssues.length === 0) {
    localStorage.setItem(
      MIGRATION_STORAGE_KEY,
      "nothing-to-import"
    );

    return;
  }

  const shouldImport = window.confirm(
    `You have ${legacyIssues.length} issue(s) ` +
    "stored only in this browser. Import them " +
    "into the online manor database?"
  );

  if (!shouldImport) {
    return;
  }

  for (const legacyIssue of legacyIssues) {
    await apiFetch("/api/issues", {
      method: "POST",
      body: JSON.stringify({
        date: legacyIssue.date,
        region: legacyIssue.region,
        title: legacyIssue.title,
        description:
          legacyIssue.description || "",
        duration:
          legacyIssue.duration ?? null
      })
    });
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

function openIssueDialog() {
  issueForm.reset();
  issueDateInput.value = getLocalDateString();
  issueDialog.showModal();
  issueTitleInput.focus();
}

function closeIssueDialog() {
  issueDialog.close();
}

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
      const payload = await apiFetch(
        "/api/issues",
        {
          method: "POST",
          body: JSON.stringify({
            date: issueDateInput.value,
            region: issueRegionInput.value,
            title,
            description,
            duration: durationValue
              ? Number(durationValue)
              : null
          })
        }
      );

      issues.unshift(payload.issue);
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

issueDialog.addEventListener(
  "click",
  event => {
    if (event.target === issueDialog) {
      closeIssueDialog();
    }
  }
);

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
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            password:
              loginPasswordInput.value
          })
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ||
          "Login failed."
        );
      }

      loginPasswordInput.value = "";
      showManor();
      await refreshIssues();
      await migrateLegacyIssues();
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
    renderIssues();
    showLoginScreen();
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
    await refreshIssues();
    await migrateLegacyIssues();
  } catch (error) {
    console.error(error);
    showLoginScreen();
  }
}

startManor();
