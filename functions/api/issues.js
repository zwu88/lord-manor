const VALID_REGIONS = new Set([
  "laboratory",
  "academy",
  "great-hall",
  "map-room",
  "training-ground",
  "gallery",
  "council-chamber"
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

function isAuthorized(request, env) {
  if (!env.MANOR_API_KEY) {
    return false;
  }

  const authorization = request.headers.get("Authorization");

  return authorization === `Bearer ${env.MANOR_API_KEY}`;
}

function validateIssue(input) {
  const date =
    typeof input.date === "string"
      ? input.date.trim()
      : "";

  const region =
    typeof input.region === "string"
      ? input.region.trim()
      : "";

  const title =
    typeof input.title === "string"
      ? input.title.trim()
      : "";

  const description =
    typeof input.description === "string"
      ? input.description.trim()
      : "";

  const duration =
    input.duration === null ||
    input.duration === undefined ||
    input.duration === ""
      ? null
      : Number(input.duration);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {
      valid: false,
      error: "The activity date is invalid."
    };
  }

  if (!VALID_REGIONS.has(region)) {
    return {
      valid: false,
      error: "The selected manor region is invalid."
    };
  }

  if (!title || title.length > 120) {
    return {
      valid: false,
      error: "The title must contain between 1 and 120 characters."
    };
  }

  if (description.length > 1500) {
    return {
      valid: false,
      error: "The description cannot exceed 1500 characters."
    };
  }

  if (
    duration !== null &&
    (
      !Number.isInteger(duration) ||
      duration < 0 ||
      duration > 1440
    )
  ) {
    return {
      valid: false,
      error: "The duration must be an integer from 0 to 1440."
    };
  }

  return {
    valid: true,
    issue: {
      date,
      region,
      title,
      description,
      duration
    }
  };
}

export async function onRequestGet(context) {
  if (!isAuthorized(context.request, context.env)) {
    return jsonResponse(
      { error: "Unauthorized" },
      401
    );
  }

  try {
    const result = await context.env.DB
      .prepare(`
        SELECT
          id,
          date,
          region,
          title,
          description,
          duration,
          created_at AS createdAt
        FROM activities
        ORDER BY date DESC, created_at DESC
      `)
      .all();

    return jsonResponse({
      issues: result.results ?? []
    });
  } catch (error) {
    console.error("Could not load issues:", error);

    return jsonResponse(
      { error: "Could not load the manor records." },
      500
    );
  }
}

export async function onRequestPost(context) {
  if (!isAuthorized(context.request, context.env)) {
    return jsonResponse(
      { error: "Unauthorized" },
      401
    );
  }

  let input;

  try {
    input = await context.request.json();
  } catch {
    return jsonResponse(
      { error: "The request body must contain valid JSON." },
      400
    );
  }

  const validation = validateIssue(input);

  if (!validation.valid) {
    return jsonResponse(
      { error: validation.error },
      400
    );
  }

  const issue = {
    id: crypto.randomUUID(),
    ...validation.issue,
    createdAt: new Date().toISOString()
  };

  try {
    await context.env.DB
      .prepare(`
        INSERT INTO activities (
          id,
          date,
          region,
          title,
          description,
          duration,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        issue.id,
        issue.date,
        issue.region,
        issue.title,
        issue.description,
        issue.duration,
        issue.createdAt
      )
      .run();

    return jsonResponse(
      { issue },
      201
    );
  } catch (error) {
    console.error("Could not save issue:", error);

    return jsonResponse(
      { error: "Could not save the manor record." },
      500
    );
  }
}

export async function onRequestDelete(context) {
  if (!isAuthorized(context.request, context.env)) {
    return jsonResponse(
      { error: "Unauthorized" },
      401
    );
  }

  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return jsonResponse(
      { error: "An issue ID is required." },
      400
    );
  }

  try {
    await context.env.DB
      .prepare(`
        DELETE FROM activities
        WHERE id = ?
      `)
      .bind(id)
      .run();

    return jsonResponse({
      deleted: true,
      id
    });
  } catch (error) {
    console.error("Could not delete issue:", error);

    return jsonResponse(
      { error: "Could not delete the manor record." },
      500
    );
  }
}
