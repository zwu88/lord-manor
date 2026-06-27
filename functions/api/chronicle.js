import {
  requireSession
} from "../_lib/auth.js";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function validateDate(value) {
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

function normalizeInteger(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? Math.trunc(number)
    : 0;
}

function normalizeBoolean(value) {
  return value === true || value === 1;
}

function normalizeOrders(orders) {
  return orders.map(order => ({
    ...order,
    completed: normalizeBoolean(
      order.completed
    )
  }));
}

function normalizeMilestones(milestones) {
  return milestones.map(milestone => ({
    ...milestone,
    completed: normalizeBoolean(
      milestone.completed
    )
  }));
}

function calculateStatistics(
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

export async function onRequestGet(context) {
  const unauthorized =
    await requireSession(context);

  if (unauthorized) {
    return unauthorized;
  }

  const url = new URL(context.request.url);
  const date = url.searchParams.get("date");

  if (!validateDate(date)) {
    return jsonResponse(
      {
        error:
          "A valid Chronicle date in YYYY-MM-DD format is required."
      },
      400
    );
  }

  const horizonDate = addDays(date, 7);

  try {
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

    const orders = normalizeOrders(
      orderResult.results ?? []
    );

    const issues =
      issueResult.results ?? [];

    const milestones =
      normalizeMilestones(
        milestoneResult.results ?? []
      );

    return jsonResponse({
      date,
      horizonDate,
      orders,
      issues,
      milestones,
      statistics:
        calculateStatistics(
          orders,
          issues,
          milestones,
          date
        )
    });
  } catch (error) {
    console.error(
      "Could not load the Manor Chronicle:",
      error
    );

    return jsonResponse(
      {
        error:
          "Could not open the Manor Chronicle."
      },
      500
    );
  }
}
