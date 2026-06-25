import {
  createExpiredSessionCookie,
  hasValidSameOrigin
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

  return jsonResponse(
    {
      authenticated: false
    },
    200,
    {
      "Set-Cookie": createExpiredSessionCookie()
    }
  );
}
