import { NextResponse } from "next/server";
import { requireRole, ALL_ROLES } from "@/lib/auth-guards";
import { isUuid } from "@/lib/rules";

// Helpers for route handlers (app/api/**): the same guarantees server actions
// get from requireRole + safely(), but as HTTP responses.

export const jsonError = (error, status) => NextResponse.json({ error }, { status });

/**
 * Wraps a GET/POST handler: validates the `[id]` param (404 for anything that
 * isn't a UUID), resolves the session with the same checks as requireRole
 * (active account, no pending password change), and turns unexpected errors
 * into a JSON 500 instead of an unhandled crash.
 *
 *   export const GET = apiRoute({ roles: ["admin"] }, async (request, { id, session }) => …)
 */
export function apiRoute({ roles = ALL_ROLES } = {}, handler) {
  return async (request, context) => {
    try {
      const params = context?.params ? await context.params : {};
      if ("id" in params && !isUuid(params.id)) return jsonError("Not found", 404);
      let session;
      try {
        session = await requireRole(...roles);
      } catch {
        return jsonError("Not authorized", 403);
      }
      return await handler(request, { ...params, session });
    } catch (err) {
      console.error(`API ${request.method} ${new URL(request.url).pathname} failed:`, err);
      return jsonError("Something went wrong. Please try again.", 500);
    }
  };
}
