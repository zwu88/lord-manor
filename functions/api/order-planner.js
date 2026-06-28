import {
  buildPlannerResponse,
  buildPlannerWeek,
  countActiveOrdersByDate,
  validatePlannerDate
} from "../_lib/order-planner.js";

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

async function readActiveOrdersForDate(
  context,
  date
) {
  const result = await context.env.DB
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
      WHERE
        next_day_tasks.task_date = ?
        AND next_day_tasks.completed = 0
      ORDER BY
        next_day_tasks.created_at ASC,
        next_day_tasks.id ASC
    `)
    .bind(date)
    .all();

  return result.results ?? [];
}

async function readOverdueOrders(
  context,
  selectedDate,
  today
) {
  const result = await context.env.DB
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
      WHERE
        next_day_tasks.task_date < ?
        AND next_day_tasks.task_date != ?
        AND next_day_tasks.completed = 0
      ORDER BY
        next_day_tasks.task_date ASC,
        next_day_tasks.created_at ASC,
        next_day_tasks.id ASC
      LIMIT 100
    `)
    .bind(today, selectedDate)
    .all();

  return result.results ?? [];
}

async function readWeekOrders(
  context,
  weekStart,
  weekEnd
) {
  const result = await context.env.DB
    .prepare(`
      SELECT
        task_date AS taskDate,
        completed
      FROM next_day_tasks
      WHERE
        task_date >= ?
        AND task_date <= ?
        AND completed = 0
    `)
    .bind(weekStart, weekEnd)
    .all();

  return result.results ?? [];
}

export async function onRequestGet(context) {
  const unauthorized =
    await requireSession(context);

  if (unauthorized) {
    return unauthorized;
  }

  const url = new URL(context.request.url);
  const selectedDate =
    url.searchParams.get("date");
  const today = url.searchParams.get("today");

  if (
    !validatePlannerDate(selectedDate) ||
    !validatePlannerDate(today)
  ) {
    return jsonResponse(
      {
        error:
          "Valid selected and local today dates are required."
      },
      400
    );
  }

  try {
    const baseWeek =
      buildPlannerWeek(today);
    const weekEnd =
      baseWeek[baseWeek.length - 1].date;

    const [
      selectedOrders,
      overdueOrders,
      weekOrders
    ] = await Promise.all([
      readActiveOrdersForDate(
        context,
        selectedDate
      ),
      readOverdueOrders(
        context,
        selectedDate,
        today
      ),
      readWeekOrders(
        context,
        today,
        weekEnd
      )
    ]);

    return jsonResponse(
      buildPlannerResponse({
        selectedDate,
        today,
        selectedOrders,
        overdueOrders,
        week:
          countActiveOrdersByDate(
            weekOrders,
            baseWeek
          )
      })
    );
  } catch (error) {
    console.error(
      "Could not load the Order Planner:",
      error
    );

    return jsonResponse(
      {
        error:
          "Could not open the Order Planner."
      },
      500
    );
  }
}
