import {
  buildChroniclePayload,
  validateChronicleDate
} from "../_lib/chronicle.js";

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

export async function onRequestGet(context) {
  const unauthorized =
    await requireSession(context);

  if (unauthorized) {
    return unauthorized;
  }

  const url = new URL(context.request.url);
  const date = url.searchParams.get("date");

  if (!validateChronicleDate(date)) {
    return jsonResponse(
      {
        error:
          "A valid Chronicle date in YYYY-MM-DD format is required."
      },
      400
    );
  }

  try {
    return jsonResponse(
      await buildChroniclePayload(
        context,
        date
      )
    );
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
