import {
  createSessionCookie,
  hasValidSameOrigin,
  passwordMatches
} from "../../_lib/auth.js";

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

export async function onRequestPost(context) {
  if (!hasValidSameOrigin(context.request)) {
    return jsonResponse(
      {
        error: "Invalid request origin."
      },
      403
    );
  }

  if (!context.env.MANOR_PASSWORD) {
    return jsonResponse(
      {
        error: "The manor password is not configured."
      },
      500
    );
  }

  let body;

  try {
    body = await context.request.json();
  } catch {
    return jsonResponse(
      {
        error: "Invalid request body."
      },
      400
    );
  }

  const valid = await passwordMatches(
    body.password,
    context.env.MANOR_PASSWORD
  );

  if (!valid) {
    return jsonResponse(
      {
        error: "The password is incorrect."
      },
      401
    );
  }

  const cookie = await createSessionCookie(
    context.env
  );

  return jsonResponse(
    {
      authenticated: true
    },
    200,
    {
      "Set-Cookie": cookie
    }
  );
}
