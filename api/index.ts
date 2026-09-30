import type { IncomingMessage, ServerResponse } from "node:http";
import { app } from "../server/_core/app";

type VercelRequest = IncomingMessage & { url?: string };

export default async function handler(req: VercelRequest, res: ServerResponse) {
  const requestUrl = new URL(req.url ?? "/", `https://${req.headers.host ?? "localhost"}`);
  const originalPath = requestUrl.searchParams.get("__originalPath");
  const debug = requestUrl.searchParams.get("__debug") === "1";

  if (originalPath) {
    requestUrl.searchParams.delete("__originalPath");
    const query = requestUrl.searchParams.toString();
    req.url = `${originalPath.startsWith("/") ? originalPath : `/${originalPath}`}${query ? `?${query}` : ""}`;
  }

  try {
    const { app } = await import("../server/_core/app");
    app(req as never, res as never);
  } catch (error) {
    console.error("[Vercel API] Failed to load Express app", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", debug ? "application/json" : "text/plain; charset=utf-8");
    res.end(
      debug
        ? JSON.stringify({ error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) })
        : "Internal Server Error",
    );
  }
}
