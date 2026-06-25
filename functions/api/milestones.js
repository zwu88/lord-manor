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

function validateMilestone(input) {
  const projectId =
    typeof input.projectId === "string"
      ? input.projectId.trim()
      : "";

  const title =
    typeof input.title === "string"
      ? input.title.trim()
      : "";

  const targetDate =
    typeof input.targetDate === "string"
      ? input.targetDate.trim()
      : "";

  const notes =
    typeof input.notes === "string"
      ? input.notes.trim()
      : "";

  const completed = input.completed === true;

  if (!projectId || projectId.length > 100) {
    return {
      valid: false,
      error: "A project is required."
    };
  }

  if (!title || title.length > 200) {
    return {
      valid: false,
      error:
        "The milestone title must contain 1–200 characters."
    };
  }

  if (!validateDate(targetDate)) {
    return {
      valid: false,
      error: "A valid target date is required."
    };
  }

  if (notes.length > 3000) {
    return {
      valid: false,
      error:
        "Milestone notes cannot exceed 3,000 characters."
    };
  }

  return {
    valid: true,
    milestone: {
      projectId,
      title,
      targetDate,
      notes,
      completed
    }
  };
}

async function readProject(context, projectId) {
  return context.env.DB
    .prepare(`
      SELECT id, name, status
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

  try {
    const result = await context.env.DB
      .prepare(`
        SELECT
          milestones.id,
          milestones.project_id AS projectId,
          milestones.title,
          milestones.target_date AS targetDate,
          milestones.notes,
          milestones.completed,
          milestones.completed_at AS completedAt,
          milestones.created_at AS createdAt,
          milestones.updated_at AS updatedAt,
          projects.name AS projectName,
          projects.status AS projectStatus
        FROM milestones
        INNER JOIN projects
          ON milestones.project_id = projects.id
        ORDER BY
          milestones.completed ASC,
          milestones.target_date ASC,
          milestones.created_at ASC
      `)
      .all();

    return jsonResponse({
      milestones: result.results ?? []
    });
  } catch (error) {
    console.error(
      "Could not load milestones:",
      error
    );

    return jsonResponse(
      {
        error:
          "Could not open the project milestones."
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

  const validation =
    validateMilestone(input);

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
    validation.milestone.projectId
  );

  if (!project) {
    return jsonResponse(
      {
        error:
          "The selected project no longer exists."
      },
      400
    );
  }

  const now = new Date().toISOString();

  const milestone = {
    id: crypto.randomUUID(),
    ...validation.milestone,
    projectName: project.name,
    projectStatus: project.status,
    completedAt:
      validation.milestone.completed
        ? now
        : null,
    createdAt: now,
    updatedAt: now
  };

  try {
    await context.env.DB
      .prepare(`
        INSERT INTO milestones (
          id,
          project_id,
          title,
          target_date,
          notes,
          completed,
          completed_at,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        milestone.id,
        milestone.projectId,
        milestone.title,
        milestone.targetDate,
        milestone.notes,
        milestone.completed ? 1 : 0,
        milestone.completedAt,
        milestone.createdAt,
        milestone.updatedAt
      )
      .run();

    return jsonResponse(
      {
        milestone
      },
      201
    );
  } catch (error) {
    console.error(
      "Could not save milestone:",
      error
    );

    return jsonResponse(
      {
        error: "Could not save the milestone."
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
        error: "A milestone ID is required."
      },
      400
    );
  }

  const validation =
    validateMilestone(input);

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
    validation.milestone.projectId
  );

  if (!project) {
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
    validation.milestone.completed
      ? input.completedAt || now
      : null;

  try {
    const result = await context.env.DB
      .prepare(`
        UPDATE milestones
        SET
          project_id = ?,
          title = ?,
          target_date = ?,
          notes = ?,
          completed = ?,
          completed_at = ?,
          updated_at = ?
        WHERE id = ?
      `)
      .bind(
        validation.milestone.projectId,
        validation.milestone.title,
        validation.milestone.targetDate,
        validation.milestone.notes,
        validation.milestone.completed
          ? 1
          : 0,
        completedAt,
        now,
        input.id
      )
      .run();

    if (!result.meta.changes) {
      return jsonResponse(
        {
          error: "The milestone was not found."
        },
        404
      );
    }

    return jsonResponse({
      milestone: {
        id: input.id,
        ...validation.milestone,
        projectName: project.name,
        projectStatus: project.status,
        completedAt,
        updatedAt: now
      }
    });
  } catch (error) {
    console.error(
      "Could not update milestone:",
      error
    );

    return jsonResponse(
      {
        error: "Could not update the milestone."
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
        error: "A milestone ID is required."
      },
      400
    );
  }

  try {
    await context.env.DB
      .prepare(`
        DELETE FROM milestones
        WHERE id = ?
      `)
      .bind(id)
      .run();

    return jsonResponse({
      deleted: true,
      id
    });
  } catch (error) {
    console.error(
      "Could not delete milestone:",
      error
    );

    return jsonResponse(
      {
        error: "Could not delete the milestone."
      },
      500
    );
  }
}
