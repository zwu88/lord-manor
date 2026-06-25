import {
  readSession
} from "../../_lib/auth.js";

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
  const session = await readSession(
    context.request,
    context.env
  );

  return jsonResponse({
    authenticated: Boolean(session)
  });
}
