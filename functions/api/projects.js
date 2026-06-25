import {
  VALID_DEPARTMENTS
} from "../_lib/departments.js";

import {
  hasValidSameOrigin,
  requireSession
} from "../_lib/auth.js";

const VALID_STATUSES = new Set([
  "proposed",
  "active",
  "suspended",
  "completed"
]);

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function optionalDate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    throw new Error("Invalid date.");
  }

  return value;
}

function validateProject(input) {
  try {
    const name =
      typeof input.name === "string"
        ? input.name.trim()
        : "";

    const region =
      typeof input.region === "string"
        ? input.region.trim()
        : "";

    const objective =
      typeof input.objective === "string"
        ? input.objective.trim()
        : "";

    const status =
      typeof input.status === "string"
        ? input.status.trim()
        : "active";

    const progress = Number(
      input.progress ?? 0
    );

    const nextAction =
      typeof input.nextAction === "string"
        ? input.nextAction.trim()
        : "";

    const notes =
      typeof input.notes === "string"
        ? input.notes.trim()
        : "";

    const startDate = optionalDate(
      input.startDate
    );

    const targetDate = optionalDate(
      input.targetDate
    );

    if (!name || name.length > 150) {
      return {
        valid: false,
        error:
          "The project name must contain 1–150 characters."
      };
    }

    if (!VALID_DEPARTMENTS.has(region)) {
      return {
        valid: false,
        error: "Invalid responsible department."
      };
    }

    if (!VALID_STATUSES.has(status)) {
      return {
        valid: false,
        error: "Invalid project status."
      };
    }

    if (
      !Number.isInteger(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      return {
        valid: false,
        error:
          "Progress must be an integer from 0 to 100."
      };
    }

    if (objective.length > 3000) {
      return {
        valid: false,
        error: "The objective is too long."
      };
    }

    if (nextAction.length > 1000) {
      return {
        valid: false,
        error: "The next action is too long."
      };
    }

    if (notes.length > 5000) {
      return {
        valid: false,
        error: "The notes are too long."
      };
    }

    return {
      valid: true,
      project: {
        name,
        region,
        objective,
        status,
        startDate,
        targetDate,
        progress,
        nextAction,
        notes
      }
    };
  } catch {
    return {
      valid: false,
      error: "One or more project dates are invalid."
    };
  }
}

export async function onRequestGet(context) {
  const unauthorized =
    await requireSession(context);

  if (unauthorized) {
    return unauthorized;
  }

  const result = await context.env.DB
    .prepare(`
      SELECT
        id,
        name,
        region,
        objective,
        status,
        start_date AS startDate,
        target_date AS targetDate,
        progress,
        next_action AS nextAction,
        notes,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM projects
      ORDER BY
        CASE status
          WHEN 'active' THEN 1
          WHEN 'proposed' THEN 2
          WHEN 'suspended' THEN 3
          WHEN 'completed' THEN 4
        END,
        target_date IS NULL,
        target_date,
        updated_at DESC
    `)
    .all();

  return jsonResponse({
    projects: result.results ?? []
  });
}

export async function onRequestPost(context) {
  const unauthorized =
    await requireSession(context);

  if (unauthorized) {
    return unauthorized;
  }

  if (!hasValidSameOrigin(context.request)) {
    return jsonResponse(
      {
        error: "Invalid request origin."
      },
      403
    );
  }

  let input;

  try {
    input = await context.request.json();
  } catch {
    return jsonResponse(
      {
        error: "Invalid request body."
      },
      400
    );
  }

  const validation = validateProject(input);

  if (!validation.valid) {
    return jsonResponse(
      {
        error: validation.error
      },
      400
    );
  }

  const now = new Date().toISOString();

  const project = {
    id: crypto.randomUUID(),
    ...validation.project,
    createdAt: now,
    updatedAt: now
  };

  await context.env.DB
    .prepare(`
      INSERT INTO projects (
        id,
        name,
        region,
        objective,
        status,
        start_date,
        target_date,
        progress,
        next_action,
        notes,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      project.id,
      project.name,
      project.region,
      project.objective,
      project.status,
      project.startDate,
      project.targetDate,
      project.progress,
      project.nextAction,
      project.notes,
      project.createdAt,
      project.updatedAt
    )
    .run();

  return jsonResponse(
    {
      project
    },
    201
  );
}

export async function onRequestPut(context) {
  const unauthorized =
    await requireSession(context);

  if (unauthorized) {
    return unauthorized;
  }

  if (!hasValidSameOrigin(context.request)) {
    return jsonResponse(
      {
        error: "Invalid request origin."
      },
      403
    );
  }

  let input;

  try {
    input = await context.request.json();
  } catch {
    return jsonResponse(
      {
        error: "Invalid request body."
      },
      400
    );
  }

  if (
    typeof input.id !== "string" ||
    !input.id.trim()
  ) {
    return jsonResponse(
      {
        error: "A project ID is required."
      },
      400
    );
  }

  const validation = validateProject(input);

  if (!validation.valid) {
    return jsonResponse(
      {
        error: validation.error
      },
      400
    );
  }

  const updatedAt = new Date().toISOString();
  const project = validation.project;

  const result = await context.env.DB
    .prepare(`
      UPDATE projects
      SET
        name = ?,
        region = ?,
        objective = ?,
        status = ?,
        start_date = ?,
        target_date = ?,
        progress = ?,
        next_action = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ?
    `)
    .bind(
      project.name,
      project.region,
      project.objective,
      project.status,
      project.startDate,
      project.targetDate,
      project.progress,
      project.nextAction,
      project.notes,
      updatedAt,
      input.id
    )
    .run();

  if (!result.meta.changes) {
    return jsonResponse(
      {
        error: "Project not found."
      },
      404
    );
  }

  return jsonResponse({
    project: {
      id: input.id,
      ...project,
      updatedAt
    }
  });
}

export async function onRequestDelete(context) {
  const unauthorized =
    await requireSession(context);

  if (unauthorized) {
    return unauthorized;
  }

  if (!hasValidSameOrigin(context.request)) {
    return jsonResponse(
      {
        error: "Invalid request origin."
      },
      403
    );
  }

  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return jsonResponse(
      {
        error: "A project ID is required."
      },
      400
    );
  }

  await context.env.DB.batch([
    context.env.DB
      .prepare(`
        UPDATE activities
        SET project_id = NULL
        WHERE project_id = ?
      `)
      .bind(id),
  
    context.env.DB
      .prepare(`
        UPDATE next_day_tasks
        SET project_id = NULL
        WHERE project_id = ?
      `)
      .bind(id),
  
    context.env.DB
      .prepare(`
        DELETE FROM milestones
        WHERE project_id = ?
      `)
      .bind(id),
  
    context.env.DB
      .prepare(`
        DELETE FROM projects
        WHERE id = ?
      `)
      .bind(id)
  ]);

  return jsonResponse({
    deleted: true,
    id
  });
}
