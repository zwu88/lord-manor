(() => {
  const existing = window.Manor;

  if (existing?.coreInitialized) {
    return;
  }

  const Manor = existing || {};
  const listeners = new Map();

  const EVENT_NAMES = Object.freeze({
    ISSUE_CHANGED: "issue:changed",
    PROJECT_CHANGED: "project:changed",
    MILESTONE_CHANGED: "milestone:changed",
    ORDER_CHANGED: "order:changed",
    ROUTE_CHANGED: "route:changed",
    SESSION_CHANGED: "session:changed"
  });

  function on(eventName, listener) {
    if (typeof listener !== "function") {
      throw new TypeError(
        "Manor event listeners must be functions."
      );
    }

    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }

    const eventListeners =
      listeners.get(eventName);

    eventListeners.add(listener);

    return () => {
      off(eventName, listener);
    };
  }

  function off(eventName, listener) {
    const eventListeners =
      listeners.get(eventName);

    if (!eventListeners) {
      return;
    }

    eventListeners.delete(listener);

    if (eventListeners.size === 0) {
      listeners.delete(eventName);
    }
  }

  function emit(eventName, payload = {}) {
    const eventListeners = [
      ...(listeners.get(eventName) || [])
    ];

    for (const listener of eventListeners) {
      try {
        listener(payload);
      } catch (error) {
        console.error(
          `Manor event listener failed for ${eventName}:`,
          error
        );
      }
    }
  }

  function createJsonError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  async function apiFetch(path, options = {}) {
    const headers = {
      ...(options.headers || {})
    };

    const init = {
      ...options,
      credentials: "same-origin",
      headers
    };

    if (
      options.body !== undefined &&
      !headers["Content-Type"]
    ) {
      headers["Content-Type"] =
        "application/json";
    }

    const response = await fetch(path, init);
    const payload = await response.json();

    if (!response.ok) {
      if (
        response.status === 401 &&
        typeof window.showLoginScreen ===
          "function"
      ) {
        window.showLoginScreen();
      }

      throw createJsonError(
        payload.error || "The request failed.",
        response.status
      );
    }

    return payload;
  }

  function localDateString() {
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

  function weekStart(dateString) {
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

  function weekEnd(dateString) {
    return addDays(weekStart(dateString), 6);
  }

  function currencyFormatter() {
    const settings =
      window.MANOR_SETTINGS ?? {
        currencyCode: "USD",
        locale: "en-US"
      };

    return new Intl.NumberFormat(
      settings.locale,
      {
        style: "currency",
        currency: settings.currencyCode
      }
    );
  }

  function moneyFromCents(value) {
    return currencyFormatter().format(
      Number(value || 0) / 100
    );
  }

  function duration(minutes) {
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

    if (text !== "") {
      element.textContent = text;
    }

    return element;
  }

  function isVisible(element) {
    return Boolean(
      element && !element.closest("[hidden]")
    );
  }

  function createRequestTracker() {
    let sequence = 0;

    return {
      next() {
        sequence += 1;
        return sequence;
      },
      cancel() {
        sequence += 1;
        return sequence;
      },
      isCurrent(value) {
        return value === sequence;
      }
    };
  }

  const departments =
    window.MANOR_DEPARTMENTS || [];
  const departmentMap =
    window.MANOR_DEPARTMENT_MAP ||
    Object.fromEntries(
      departments.map(department => [
        department.id,
        department
      ])
    );
  const settings =
    window.MANOR_SETTINGS ?? {
      currencyCode: "USD",
      locale: "en-US"
    };

  Manor.coreInitialized = true;
  Manor.events = Object.freeze({
    names: EVENT_NAMES,
    on,
    off,
    emit
  });
  Manor.api = Object.freeze({
    fetchJson: apiFetch
  });
  Manor.dates = Object.freeze({
    localDateString,
    isValidDateString,
    addDays,
    weekStart,
    weekEnd
  });
  Manor.format = Object.freeze({
    moneyFromCents,
    duration,
    pluralize
  });
  Manor.dom = Object.freeze({
    createElement,
    isVisible
  });
  Manor.async = Object.freeze({
    createRequestTracker
  });
  Manor.config = Object.freeze({
    departments,
    departmentMap,
    settings
  });
  Manor.features = Manor.features || {};

  window.Manor = Manor;
})();
