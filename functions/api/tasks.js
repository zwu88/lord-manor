import {
  hasValidSameOrigin,
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
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  );
}

function validateTask(input) {
  const taskDate =
    typeof input.taskDate === "string"
      ? input.taskDate.trim()
      : "";

  const title =
    typeof input.title === "string"
      ? input.title.trim()
      : "";

  const description =
    typeof input.description === "string"
      ? input.description.trim()
      : "";

  const projectId =
    typeof input.projectId === "string" &&
    input.projectId.trim()
      ? input.projectId.trim()
      : null;

  const completed = input.completed === true;

  if (!validateDate(taskDate)) {
    return {
      valid: false,
      error: "The task date is invalid."
    };
  }

  if (!title || title.length > 200) {
    return {
      valid: false,
      error:
        "The task title must contain 1–200 characters."
    };
  }

  if (description.length > 2000) {
    return {
      valid: false,
      error:
        "The task description cannot exceed 2,000 characters."
    };
  }

  if (projectId && projectId.length > 100) {
    return {
      valid: false,
      error: "The selected project is invalid."
    };
  }

  return {
    valid: true,
    task: {
      taskDate,
      title,
      description,
      projectId,
      completed
    }
  };
}

async function readProject(context, projectId) {
  if (!projectId) {
    return null;
  }

  return context.env.DB
    .prepare(`
      SELECT id, name
      FROM projects
      WHERE id = ?
    `)
    .bind(projectId)
    .first();
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
        error: "A valid task date is required."
      },
      400
    );
  }

  try {
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
        WHERE next_day_tasks.task_date = ?
        ORDER BY
          next_day_tasks.completed ASC,
          next_day_tasks.created_at ASC
      `)
      .bind(date)
      .all();

    return jsonResponse({
      tasks: result.results ?? []
    });
  } catch (error) {
    console.error("Could not load tasks:", error);

    return jsonResponse(
      {
        error: "Could not open tomorrow's orders."
      },
      500
    );
  }
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
        error: "The request body is invalid."
      },
      400
    );
  }

  const validation = validateTask(input);

  if (!validation.valid) {
    return jsonResponse(
      {
        error: validation.error
      },
      400
    );
  }

  const project = await readProject(
    context,
    validation.task.projectId
  );

  if (
    validation.task.projectId &&
    !project
  ) {
    return jsonResponse(
      {
        error:
          "The selected project no longer exists."
      },
      400
    );
  }

  const now = new Date().toISOString();

  const task = {
    id: crypto.randomUUID(),
    ...validation.task,
    projectName: project?.name ?? null,
    completedAt:
      validation.task.completed ? now : null,
    createdAt: now,
    updatedAt: now
  };

  try {
    await context.env.DB
      .prepare(`
        INSERT INTO next_day_tasks (
          id,
          task_date,
          title,
          description,
          project_id,
          completed,
          completed_at,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        task.id,
        task.taskDate,
        task.title,
        task.description,
        task.projectId,
        task.completed ? 1 : 0,
        task.completedAt,
        task.createdAt,
        task.updatedAt
      )
      .run();

    return jsonResponse(
      {
        task
      },
      201
    );
  } catch (error) {
    console.error("Could not save task:", error);

    return jsonResponse(
      {
        error: "Could not save tomorrow's order."
      },
      500
    );
  }
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
        error: "The request body is invalid."
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
        error: "A task ID is required."
      },
      400
    );
  }

  const validation = validateTask(input);

  if (!validation.valid) {
    return jsonResponse(
      {
        error: validation.error
      },
      400
    );
  }

  const project = await readProject(
    context,
    validation.task.projectId
  );

  if (
    validation.task.projectId &&
    !project
  ) {
    return jsonResponse(
      {
        error:
          "The selected project no longer exists."
      },
      400
    );
  }

  const now = new Date().toISOString();

  const completedAt =
    validation.task.completed
      ? input.completedAt || now
      : null;

  try {
    const result = await context.env.DB
      .prepare(`
        UPDATE next_day_tasks
        SET
          task_date = ?,
          title = ?,
          description = ?,
          project_id = ?,
          completed = ?,
          completed_at = ?,
          updated_at = ?
        WHERE id = ?
      `)
      .bind(
        validation.task.taskDate,
        validation.task.title,
        validation.task.description,
        validation.task.projectId,
        validation.task.completed ? 1 : 0,
        completedAt,
        now,
        input.id
      )
      .run();

    if (!result.meta.changes) {
      return jsonResponse(
        {
          error: "The task was not found."
        },
        404
      );
    }

    return jsonResponse({
      task: {
        id: input.id,
        ...validation.task,
        projectName: project?.name ?? null,
        completedAt,
        updatedAt: now
      }
    });
  } catch (error) {
    console.error("Could not update task:", error);

    return jsonResponse(
      {
        error: "Could not update tomorrow's order."
      },
      500
    );
  }
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
        error: "A task ID is required."
      },
      400
    );
  }

  try {
    await context.env.DB
      .prepare(`
        DELETE FROM next_day_tasks
        WHERE id = ?
      `)
      .bind(id)
      .run();

    return jsonResponse({
      deleted: true,
      id
    });
  } catch (error) {
    console.error("Could not delete task:", error);

    return jsonResponse(
      {
        error: "Could not delete tomorrow's order."
      },
      500
    );
  }
}
