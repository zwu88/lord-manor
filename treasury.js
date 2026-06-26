(() => {
  const departments =
    window.MANOR_DEPARTMENTS ?? [];

  const departmentMap =
    window.MANOR_DEPARTMENT_MAP ?? {};

  const manorSettings =
    window.MANOR_SETTINGS ?? {
      currencyCode: "USD",
      locale: "en-US"
    };

  const manorCurrencyCode =
    manorSettings.currencyCode;

  const manorLocale =
    manorSettings.locale;

  const treasuryTotalMoney =
    document.querySelector(
      "#treasury-total-money"
    );

  const treasuryMoneyPie =
    document.querySelector(
      "#treasury-money-pie"
    );

  const treasuryMoneyLegend =
    document.querySelector(
      "#treasury-money-legend"
    );

  const treasuryMoneyPeriod =
    document.querySelector(
      "#treasury-money-period"
    );

  const treasuryMoneyScaleButtons =
    document.querySelectorAll(
      "[data-treasury-money-scale]"
    );

  const treasuryTimePie =
    document.querySelector(
      "#treasury-time-pie"
    );

  const treasuryTimeLegend =
    document.querySelector(
      "#treasury-time-legend"
    );

  const treasuryTimePeriod =
    document.querySelector(
      "#treasury-time-period"
    );

  const treasuryTimeScaleButtons =
    document.querySelectorAll(
      "[data-treasury-scale]"
    );

  const treasuryColors = [
    "#7d2d2d",
    "#a57a2f",
    "#4e6a52",
    "#51657e",
    "#76567a",
    "#9a5c3d",
    "#3f7775",
    "#7b704b"
  ];

  let treasuryMoneyScale = "week";
  let treasuryTimeScale = "week";
  let currentIssues = [];

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

  function localDateString(date) {
    const timezoneOffset =
      date.getTimezoneOffset() * 60_000;

    return new Date(
      date.getTime() - timezoneOffset
    )
      .toISOString()
      .slice(0, 10);
  }

  function getTreasuryDateRange(scale) {
    const now = new Date();

    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const end = new Date(start);

    if (scale === "week") {
      const daysSinceMonday =
        (start.getDay() + 6) % 7;

      start.setDate(
        start.getDate() -
        daysSinceMonday
      );

      end.setTime(start.getTime());
      end.setDate(end.getDate() + 7);
    } else {
      start.setDate(1);

      end.setTime(start.getTime());
      end.setMonth(end.getMonth() + 1);
    }

    return {
      start: localDateString(start),
      end: localDateString(end)
    };
  }

  function formatTreasuryPeriod(
    scale,
    range
  ) {
    if (scale === "week") {
      const endDate = new Date(
        `${range.end}T12:00:00`
      );

      endDate.setDate(
        endDate.getDate() - 1
      );

      const formattedEnd =
        new Intl.DateTimeFormat(
          manorLocale,
          {
            month: "short",
            day: "numeric",
            year: "numeric"
          }
        ).format(endDate);

      return (
        `Current week: ` +
        `${formatDate(range.start)}–` +
        `${formattedEnd}`
      );
    }

    const monthDate = new Date(
      `${range.start}T12:00:00`
    );

    const formattedMonth =
      new Intl.DateTimeFormat(
        manorLocale,
        {
          month: "long",
          year: "numeric"
        }
      ).format(monthDate);

    return `Current month: ${formattedMonth}`;
  }

  function trackedDepartmentEntries(
    issues,
    metric,
    range = null
  ) {
    const totals = new Map();

    for (const department of departments) {
      if (department.financeTracked) {
        totals.set(department.id, 0);
      }
    }

    for (const issue of issues) {
      const department =
        departmentMap[issue.region];

      if (!department?.financeTracked) {
        continue;
      }

      if (
        range &&
        (
          issue.date < range.start ||
          issue.date >= range.end
        )
      ) {
        continue;
      }

      const value =
        metric === "money"
          ? Number(
              issue.moneyCostCents
            ) || 0
          : Number(issue.duration) || 0;

      totals.set(
        department.id,
        (totals.get(department.id) || 0) +
        value
      );
    }

    return departments
      .filter(
        department =>
          department.financeTracked
      )
      .map((department, index) => ({
        id: department.id,
        name: department.shortName,
        value:
          totals.get(department.id) || 0,
        color:
          treasuryColors[
            index % treasuryColors.length
          ]
      }))
      .filter(entry => entry.value > 0);
  }

  function renderTreasuryPie(
    pieElement,
    legendElement,
    entries,
    formatValue,
    centerText
  ) {
    const total = entries.reduce(
      (sum, entry) =>
        sum + entry.value,
      0
    );

    pieElement.replaceChildren();
    legendElement.replaceChildren();

    const center = createTextElement(
      "span",
      "treasury-pie-center",
      centerText
    );

    pieElement.append(center);

    if (total <= 0) {
      pieElement.style.background =
        "#ddd3bc";

      legendElement.append(
        createTextElement(
          "p",
          "office-empty",
          "No expenditure has been recorded for this period."
        )
      );

      return;
    }

    let cursor = 0;

    const gradientParts =
      entries.map(entry => {
        const start = cursor;

        cursor +=
          (entry.value / total) * 100;

        return (
          `${entry.color} ` +
          `${start}% ${cursor}%`
        );
      });

    pieElement.style.background =
      `conic-gradient(${
        gradientParts.join(", ")
      })`;

    for (const entry of entries) {
      const item =
        document.createElement("div");

      item.className =
        "treasury-legend-item";

      const swatch =
        document.createElement("span");

      swatch.className =
        "treasury-legend-swatch";

      swatch.style.backgroundColor =
        entry.color;

      const name = createTextElement(
        "span",
        "treasury-legend-name",
        entry.name
      );

      const value = createTextElement(
        "span",
        "treasury-legend-value",
        formatValue(entry.value)
      );

      item.append(
        swatch,
        name,
        value
      );

      legendElement.append(item);
    }
  }

  function render(
    nextIssues = currentIssues
  ) {
    if (Array.isArray(nextIssues)) {
      currentIssues = nextIssues;
    }

    const allMoneyEntries =
      trackedDepartmentEntries(
        currentIssues,
        "money"
      );

    const totalMoney =
      allMoneyEntries.reduce(
        (sum, entry) =>
          sum + entry.value,
        0
      );

    treasuryTotalMoney.textContent =
      formatMoneyFromCents(totalMoney);

    const moneyRange =
      getTreasuryDateRange(
        treasuryMoneyScale
      );

    const moneyEntries =
      trackedDepartmentEntries(
        currentIssues,
        "money",
        moneyRange
      );

    const periodMoney =
      moneyEntries.reduce(
        (sum, entry) =>
          sum + entry.value,
        0
      );

    treasuryMoneyPeriod.textContent =
      formatTreasuryPeriod(
        treasuryMoneyScale,
        moneyRange
      );

    renderTreasuryPie(
      treasuryMoneyPie,
      treasuryMoneyLegend,
      moneyEntries,
      formatMoneyFromCents,
      formatMoneyFromCents(periodMoney)
    );

    const timeRange =
      getTreasuryDateRange(
        treasuryTimeScale
      );

    const timeEntries =
      trackedDepartmentEntries(
        currentIssues,
        "time",
        timeRange
      );

    const totalMinutes =
      timeEntries.reduce(
        (sum, entry) =>
          sum + entry.value,
        0
      );

    treasuryTimePeriod.textContent =
      formatTreasuryPeriod(
        treasuryTimeScale,
        timeRange
      );

    renderTreasuryPie(
      treasuryTimePie,
      treasuryTimeLegend,
      timeEntries,
      value => `${value} min`,
      `${totalMinutes} min`
    );

    for (
      const button
      of treasuryMoneyScaleButtons
    ) {
      button.classList.toggle(
        "is-active",
        button.dataset
          .treasuryMoneyScale ===
          treasuryMoneyScale
      );
    }

    for (
      const button
      of treasuryTimeScaleButtons
    ) {
      button.classList.toggle(
        "is-active",
        button.dataset
          .treasuryScale ===
          treasuryTimeScale
      );
    }
  }

  for (
    const button
    of treasuryMoneyScaleButtons
  ) {
    button.addEventListener(
      "click",
      () => {
        treasuryMoneyScale =
          button.dataset
            .treasuryMoneyScale;

        render();
      }
    );
  }

  for (
    const button
    of treasuryTimeScaleButtons
  ) {
    button.addEventListener(
      "click",
      () => {
        treasuryTimeScale =
          button.dataset.treasuryScale;

        render();
      }
    );
  }

  window.ManorTreasury =
    Object.freeze({
      render
    });
})();
