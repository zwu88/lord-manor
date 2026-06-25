const STORAGE_KEY = "lord-manor-issues-v1";

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

function loadIssues() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    console.error("Could not read stored issues:", error);
    return [];
  }
}

function saveIssues() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
}

function formatIssueDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function createTextElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  element.textContent = text;
  return element;
}

function renderIssues() {
  issueList.replaceChildren();

  const sortedIssues = [...issues].sort((first, second) => {
    const firstTime = `${first.date}-${first.createdAt}`;
    const secondTime = `${second.date}-${second.createdAt}`;
    return secondTime.localeCompare(firstTime);
  });

  emptyIssues.hidden = sortedIssues.length > 0;

  for (const issue of sortedIssues) {
    const card = document.createElement("article");
    card.className = "issue-card";

    const header = document.createElement("div");
    header.className = "issue-card-header";

    const headingContainer = document.createElement("div");

    const durationText = issue.duration
      ? ` · ${issue.duration} minutes`
      : "";

    const meta = createTextElement(
      "p",
      "issue-meta",
      `${regionNames[issue.region]} · ${formatIssueDate(issue.date)}${durationText}`
    );

    const title = createTextElement("h3", "", issue.title);

    headingContainer.append(meta, title);

    const deleteButton = createTextElement(
      "button",
      "delete-button",
      "Delete"
    );

    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => {
      const confirmed = window.confirm(
        `Delete the issue “${issue.title}”?`
      );

      if (!confirmed) {
        return;
      }

      issues = issues.filter((item) => item.id !== issue.id);
      saveIssues();
      renderIssues();
    });

    header.append(headingContainer, deleteButton);
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

function openIssueDialog() {
  issueForm.reset();
  issueDateInput.value = getLocalDateString();
  issueDialog.showModal();
  issueTitleInput.focus();
}

function closeIssueDialog() {
  issueDialog.close();
}

let issues = loadIssues();

recordButton.addEventListener("click", openIssueDialog);
closeDialogButton.addEventListener("click", closeIssueDialog);
cancelIssueButton.addEventListener("click", closeIssueDialog);

issueForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = issueTitleInput.value.trim();
  const description = issueDescriptionInput.value.trim();
  const durationValue = issueDurationInput.value.trim();

  if (!title) {
    return;
  }

  const newIssue = {
    id: crypto.randomUUID(),
    date: issueDateInput.value,
    region: issueRegionInput.value,
    title,
    description,
    duration: durationValue ? Number(durationValue) : null,
    createdAt: new Date().toISOString()
  };

  issues.push(newIssue);
  saveIssues();
  renderIssues();
  closeIssueDialog();
});

issueDialog.addEventListener("click", (event) => {
  if (event.target === issueDialog) {
    closeIssueDialog();
  }
});

renderIssues();
