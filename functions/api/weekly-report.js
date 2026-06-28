import {
  buildWeeklyReportResponse,
  getWeeklyReportRange,
  validateWeeklyReportDate
} from "../_lib/weekly-report.js";

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

function validateQueryDate(
  value,
  missingError,
  invalidError
) {
  if (!value) {
    return missingError;
  }

  if (!validateWeeklyReportDate(value)) {
    return invalidError;
  }

  return null;
}

async function readIssues(
  context,
  weekStart,
  effectiveEndDate
) {
  const result = await context.env.DB
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
        activities.created_at AS createdAt,
        activities.updated_at AS updatedAt,
        projects.name AS projectName
      FROM activities
      LEFT JOIN projects
        ON activities.project_id = projects.id
      WHERE
        activities.date >= ?
        AND activities.date <= ?
      ORDER BY
        activities.date ASC,
        activities.created_at ASC,
        activities.id ASC
    `)
    .bind(weekStart, effectiveEndDate)
    .all();

  return result.results ?? [];
}

async function readCompletedProjects(
  context,
  weekStart,
  effectiveEndDate
) {
  const result = await context.env.DB
    .prepare(`
      SELECT
        id,
        name,
        region,
        status,
        completed_at AS completedAt
      FROM projects
      WHERE
        completed_at IS NOT NULL
        AND substr(completed_at, 1, 10) >= ?
        AND substr(completed_at, 1, 10) <= ?
    `)
    .bind(weekStart, effectiveEndDate)
    .all();

  return result.results ?? [];
}

async function readCompletedMilestones(
  context,
  weekStart,
  effectiveEndDate
) {
  const result = await context.env.DB
    .prepare(`
      SELECT
        milestones.id,
        milestones.title,
        milestones.project_id AS projectId,
        projects.name AS projectName,
        milestones.target_date AS targetDate,
        milestones.completed_at AS completedAt,
        milestones.notes
      FROM milestones
      INNER JOIN projects
        ON milestones.project_id = projects.id
      WHERE
        milestones.completed_at IS NOT NULL
        AND substr(milestones.completed_at, 1, 10) >= ?
        AND substr(milestones.completed_at, 1, 10) <= ?
    `)
    .bind(weekStart, effectiveEndDate)
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
  const date = url.searchParams.get("date");
  const today = url.searchParams.get("today");

  const dateError = validateQueryDate(
    date,
    "The report date is required.",
    "The report date must be a real YYYY-MM-DD date."
  );

  if (dateError) {
    return jsonResponse(
      {
        error: dateError
      },
      400
    );
  }

  const todayError = validateQueryDate(
    today,
    "The local today date is required.",
    "The local today date must be a real YYYY-MM-DD date."
  );

  if (todayError) {
    return jsonResponse(
      {
        error: todayError
      },
      400
    );
  }

  let range;

  try {
    range = getWeeklyReportRange(
      date,
      today
    );
  } catch (error) {
    if (error.message === "FUTURE_WEEK") {
      return jsonResponse(
        {
          error:
            "Choose this week or an earlier week."
        },
        400
      );
    }

    throw error;
  }

  try {
    const [
      issues,
      completedProjects,
      completedMilestones
    ] = await Promise.all([
      readIssues(
        context,
        range.weekStart,
        range.effectiveEndDate
      ),
      readCompletedProjects(
        context,
        range.weekStart,
        range.effectiveEndDate
      ),
      readCompletedMilestones(
        context,
        range.weekStart,
        range.effectiveEndDate
      )
    ]);

    return jsonResponse(
      buildWeeklyReportResponse({
        date,
        today,
        issues,
        completedProjects,
        completedMilestones
      })
    );
  } catch (error) {
    console.error(
      "Could not load the Weekly Estate Report:",
      error
    );

    return jsonResponse(
      {
        error:
          "Could not open the Weekly Estate Report."
      },
      500
    );
  }
}
