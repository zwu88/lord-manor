import {
  CHRONICLE_FORMAT_VERSION,
  buildChronicleEditionContent,
  buildChroniclePayload,
  normalizeStoredChronicleEdition,
  validateChronicleDate
} from "../_lib/chronicle.js";

import {
  hasValidSameOrigin,
  requireSession
} from "../_lib/auth.js";

const STORAGE_UNAVAILABLE_CODE =
  "CHRONICLE_EDITION_STORAGE_UNAVAILABLE";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function storageUnavailableResponse() {
  return jsonResponse(
    {
      error:
        "Chronicle edition storage is not available.",
      code: STORAGE_UNAVAILABLE_CODE
    },
    503
  );
}

function isStorageUnavailableError(error) {
  return /chronicle_editions/i.test(
    String(error?.message || error)
  );
}

function editionMetadata(row) {
  return {
    date: row.editionDate,
    horizonDate: row.horizonDate,
    headline: row.headline,
    formatVersion: row.formatVersion,
    sealedAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function readRequestedDate(input) {
  return typeof input?.date === "string"
    ? input.date.trim()
    : "";
}

async function buildEditionRecord(
  context,
  date,
  now
) {
  const payload =
    await buildChroniclePayload(
      context,
      date
    );

  const content =
    buildChronicleEditionContent(
      payload
    );

  return {
    editionDate: payload.date,
    horizonDate: payload.horizonDate,
    headline:
      payload.presentation.headline,
    lead: payload.presentation.lead,
    contentJson:
      JSON.stringify(content),
    formatVersion:
      CHRONICLE_FORMAT_VERSION,
    updatedAt: now
  };
}

async function readEdition(context, date) {
  const row = await context.env.DB
    .prepare(`
      SELECT
        edition_date AS editionDate,
        horizon_date AS horizonDate,
        headline,
        lead,
        content_json AS contentJson,
        format_version AS formatVersion,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM chronicle_editions
      WHERE edition_date = ?
    `)
    .bind(date)
    .first();

  return row;
}

export async function onRequestGet(context) {
  const unauthorized =
    await requireSession(context);

  if (unauthorized) {
    return unauthorized;
  }

  const url = new URL(context.request.url);
  const date = url.searchParams.get("date");

  try {
    if (date !== null) {
      if (!validateChronicleDate(date)) {
        return jsonResponse(
          {
            error:
              "A valid Chronicle edition date in YYYY-MM-DD format is required."
          },
          400
        );
      }

      const row =
        await readEdition(context, date);

      if (!row) {
        return jsonResponse(
          {
            error:
              "The Chronicle edition was not found."
          },
          404
        );
      }

      try {
        return jsonResponse({
          edition:
            normalizeStoredChronicleEdition(
              row
            )
        });
      } catch (error) {
        console.error(
          "Could not parse Chronicle edition:",
          error
        );

        return jsonResponse(
          {
            error:
              "The stored Chronicle edition is invalid."
          },
          500
        );
      }
    }

    const limitValue =
      url.searchParams.get("limit");

    const limit =
      limitValue === null
        ? 100
        : Number(limitValue);

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return jsonResponse(
        {
          error:
            "The Chronicle edition limit must be an integer from 1 to 100."
        },
        400
      );
    }

    const result = await context.env.DB
      .prepare(`
        SELECT
          edition_date AS editionDate,
          horizon_date AS horizonDate,
          headline,
          format_version AS formatVersion,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM chronicle_editions
        ORDER BY
          edition_date DESC,
          updated_at DESC,
          created_at DESC
        LIMIT ?
      `)
      .bind(limit)
      .all();

    const editions =
      (result.results ?? [])
        .map(editionMetadata);

    return jsonResponse({
      editions,
      count: editions.length
    });
  } catch (error) {
    if (isStorageUnavailableError(error)) {
      return storageUnavailableResponse();
    }

    console.error(
      "Could not load Chronicle editions:",
      error
    );

    return jsonResponse(
      {
        error:
          "Could not load Chronicle editions."
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

  const body =
    await readJsonBody(context.request);

  if (!body) {
    return jsonResponse(
      {
        error:
          "The request body must contain valid JSON."
      },
      400
    );
  }

  const date = readRequestedDate(body);

  if (!validateChronicleDate(date)) {
    return jsonResponse(
      {
        error:
          "A valid Chronicle edition date in YYYY-MM-DD format is required."
      },
      400
    );
  }

  try {
    const existing =
      await readEdition(context, date);

    if (existing) {
      return jsonResponse(
        {
          error:
            "A Chronicle edition has already been sealed for this date."
        },
        409
      );
    }

    const now = new Date().toISOString();
    const record =
      await buildEditionRecord(
        context,
        date,
        now
      );

    await context.env.DB
      .prepare(`
        INSERT INTO chronicle_editions (
          edition_date,
          horizon_date,
          headline,
          lead,
          content_json,
          format_version,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        record.editionDate,
        record.horizonDate,
        record.headline,
        record.lead,
        record.contentJson,
        record.formatVersion,
        now,
        record.updatedAt
      )
      .run();

    const row =
      await readEdition(context, date);

    return jsonResponse(
      {
        edition:
          normalizeStoredChronicleEdition(
            row
          )
      },
      201
    );
  } catch (error) {
    if (isStorageUnavailableError(error)) {
      return storageUnavailableResponse();
    }

    console.error(
      "Could not seal Chronicle edition:",
      error
    );

    return jsonResponse(
      {
        error:
          "Could not seal the Chronicle edition."
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

  const body =
    await readJsonBody(context.request);

  if (!body) {
    return jsonResponse(
      {
        error:
          "The request body must contain valid JSON."
      },
      400
    );
  }

  const date = readRequestedDate(body);

  if (!validateChronicleDate(date)) {
    return jsonResponse(
      {
        error:
          "A valid Chronicle edition date in YYYY-MM-DD format is required."
      },
      400
    );
  }

  try {
    const existing =
      await readEdition(context, date);

    if (!existing) {
      return jsonResponse(
        {
          error:
            "The Chronicle edition was not found."
        },
        404
      );
    }

    const now = new Date().toISOString();
    const record =
      await buildEditionRecord(
        context,
        date,
        now
      );

    const result = await context.env.DB
      .prepare(`
        UPDATE chronicle_editions
        SET
          horizon_date = ?,
          headline = ?,
          lead = ?,
          content_json = ?,
          format_version = ?,
          updated_at = ?
        WHERE edition_date = ?
      `)
      .bind(
        record.horizonDate,
        record.headline,
        record.lead,
        record.contentJson,
        record.formatVersion,
        record.updatedAt,
        date
      )
      .run();

    if (!result.meta?.changes) {
      return jsonResponse(
        {
          error:
            "The Chronicle edition was not found."
        },
        404
      );
    }

    const row =
      await readEdition(context, date);

    return jsonResponse({
      edition:
        normalizeStoredChronicleEdition(row)
    });
  } catch (error) {
    if (isStorageUnavailableError(error)) {
      return storageUnavailableResponse();
    }

    console.error(
      "Could not regenerate Chronicle edition:",
      error
    );

    return jsonResponse(
      {
        error:
          "Could not regenerate the Chronicle edition."
      },
      500
    );
  }
}
