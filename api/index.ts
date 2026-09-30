import type { IncomingMessage, ServerResponse } from "node:http";
import { app } from "../server/_core/app";

type VercelRequest = IncomingMessage & { url?: string };

export default function handler(req: VercelRequest, res: ServerResponse) {
  const requestUrl = new URL(req.url ?? "/", `https://${req.headers.host ?? "localhost"}`);
  const originalPath = requestUrl.searchParams.get("__originalPath");

  if (originalPath) {
    requestUrl.searchParams.delete("__originalPath");
    const query = requestUrl.searchParams.toString();
    req.url = `${originalPath.startsWith("/") ? originalPath : `/${originalPath}`}${query ? `?${query}` : ""}`;
  }

  app(req as never, res as never);
}
