export const CHRONICLE_FORMAT_VERSION = 1;

export function validateChronicleDate(value) {
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

export function addChronicleDays(
  dateString,
  days
) {
  const date = new Date(
    `${dateString}T00:00:00.000Z`
  );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return date.toISOString().slice(0, 10);
}

function normalizeInteger(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? Math.trunc(number)
    : 0;
}

function normalizeBoolean(value) {
  return value === true || value === 1;
}

export function normalizeChronicleOrders(
  orders
) {
  return orders.map(order => ({
    ...order,
    completed: normalizeBoolean(
      order.completed
    )
  }));
}

export function normalizeChronicleMilestones(
  milestones
) {
  return milestones.map(milestone => ({
    ...milestone,
    completed: normalizeBoolean(
      milestone.completed
    )
  }));
}

export function calculateChronicleStatistics(
  orders,
  issues,
  milestones,
  date
) {
  const pending =
    orders.filter(order => !order.completed)
      .length;

  const completed =
    orders.length - pending;

  const durationMinutes =
    issues.reduce(
      (sum, issue) =>
        sum +
        normalizeInteger(issue.duration),
      0
    );

  const moneyCostCents =
    issues.reduce(
      (sum, issue) =>
        sum +
        normalizeInteger(
          issue.moneyCostCents
        ),
      0
    );

  const overdue =
    milestones.filter(
      milestone =>
        milestone.targetDate < date
    ).length;

  const dueToday =
    milestones.filter(
      milestone =>
        milestone.targetDate === date
    ).length;

  const dueSoon =
    milestones.filter(
      milestone =>
        milestone.targetDate > date
    ).length;

  return {
    orders: {
      total: orders.length,
      pending,
      completed
    },
    issues: {
      total: issues.length,
      durationMinutes,
      moneyCostCents
    },
    milestones: {
      total: milestones.length,
      overdue,
      dueToday,
      dueSoon
    }
  };
}

export function buildChroniclePresentation(
  statistics
) {
  let headline;

  if (statistics.orders.pending > 0) {
    headline =
      `${statistics.orders.pending} ${
        statistics.orders.pending === 1
          ? "Order Awaits"
          : "Orders Await"
      } Attention`;
  } else if (statistics.issues.total > 0) {
    headline =
      `${statistics.issues.total} ${
        statistics.issues.total === 1
          ? "Affair Enters"
          : "Affairs Enter"
      } Today's Record`;
  } else if (statistics.milestones.total > 0) {
    headline =
      "Council Deadlines Approach";
  } else {
    headline =
      "A Quiet Morning Across the Manor";
  }

  const lead =
    `Today's dispatch contains ${
      statistics.orders.total
    } ${
      statistics.orders.total === 1
        ? "order"
        : "orders"
    } (${statistics.orders.pending} pending and ${
      statistics.orders.completed
    } completed), ${statistics.issues.total} ${
      statistics.issues.total === 1
        ? "recorded affair"
        : "recorded affairs"
    }, and ${statistics.milestones.total} ${
      statistics.milestones.total === 1
        ? "milestone"
        : "milestones"
    } overdue or due within the next seven days.`;

  return {
    headline,
    lead
  };
}

export async function buildChroniclePayload(
  context,
  date
) {
  const horizonDate =
    addChronicleDays(date, 7);

  const [
    orderResult,
    issueResult,
    milestoneResult
  ] = await Promise.all([
    context.env.DB
      .prepare(`
        SELECT
          next_day_tasks.id,
          next_day_tasks.task_date AS taskDate,
          next_day_tasks.title,
          next_day_tasks.description,
          next_day_tasks.project_id AS projectId,
          next_day_tasks.completed,
          next_day_tasks.completed_at AS completedAt,
          next_day_tasks.created_at AS createdAt,
          next_day_tasks.updated_at AS updatedAt,
          projects.name AS projectName
        FROM next_day_tasks
        LEFT JOIN projects
          ON next_day_tasks.project_id = projects.id
        WHERE next_day_tasks.task_date = ?
        ORDER BY
          next_day_tasks.completed ASC,
          next_day_tasks.created_at ASC,
          next_day_tasks.id ASC
      `)
      .bind(date)
      .all(),

    context.env.DB
      .prepare(`
        SELECT
          activities.id,
          activities.date,
          activities.region,
          activities.title,
          activities.description,
          activities.duration,
          activities.money_cost_cents AS moneyCostCents,
          activities.project_id AS projectId,
          projects.name AS projectName,
          activities.created_at AS createdAt,
          activities.updated_at AS updatedAt
        FROM activities
        LEFT JOIN projects
          ON activities.project_id = projects.id
        WHERE activities.date = ?
        ORDER BY
          activities.created_at DESC,
          activities.id ASC
        LIMIT 5
      `)
      .bind(date)
      .all(),

    context.env.DB
      .prepare(`
        SELECT
          milestones.id,
          milestones.project_id AS projectId,
          projects.name AS projectName,
          projects.status AS projectStatus,
          milestones.title,
          milestones.target_date AS targetDate,
          milestones.notes,
          milestones.completed,
          milestones.completed_at AS completedAt,
          milestones.created_at AS createdAt,
          milestones.updated_at AS updatedAt
        FROM milestones
        INNER JOIN projects
          ON milestones.project_id = projects.id
        WHERE
          milestones.completed = 0
          AND milestones.target_date <= ?
        ORDER BY
          milestones.target_date ASC,
          milestones.created_at ASC,
          milestones.id ASC
        LIMIT 5
      `)
      .bind(horizonDate)
      .all()
  ]);

  const orders = normalizeChronicleOrders(
    orderResult.results ?? []
  );

  const issues =
    issueResult.results ?? [];

  const milestones =
    normalizeChronicleMilestones(
      milestoneResult.results ?? []
    );

  const statistics =
    calculateChronicleStatistics(
      orders,
      issues,
      milestones,
      date
    );

  const presentation =
    buildChroniclePresentation(
      statistics
    );

  return {
    date,
    horizonDate,
    presentation,
    orders,
    issues,
    milestones,
    statistics
  };
}

export function buildChronicleEditionContent(
  payload
) {
  return {
    date: payload.date,
    horizonDate: payload.horizonDate,
    presentation: payload.presentation,
    orders: payload.orders,
    issues: payload.issues,
    milestones: payload.milestones,
    statistics: payload.statistics,
    formatVersion: CHRONICLE_FORMAT_VERSION
  };
}

export function normalizeStoredChronicleEdition(
  row
) {
  let content;

  try {
    content = JSON.parse(row.contentJson);
  } catch {
    throw new Error(
      "Stored Chronicle edition content is invalid."
    );
  }

  return {
    date: row.editionDate,
    horizonDate: row.horizonDate,
    presentation:
      content.presentation ?? {
        headline: row.headline,
        lead: row.lead
      },
    orders:
      Array.isArray(content.orders)
        ? content.orders
        : [],
    issues:
      Array.isArray(content.issues)
        ? content.issues
        : [],
    milestones:
      Array.isArray(content.milestones)
        ? content.milestones
        : [],
    statistics:
      content.statistics ?? {
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
      },
    formatVersion:
      normalizeInteger(
        row.formatVersion ??
        content.formatVersion ??
        CHRONICLE_FORMAT_VERSION
      ),
    sealedAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}
