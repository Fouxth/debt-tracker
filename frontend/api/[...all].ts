import { createApp } from "../../backend/src/app";

const app = createApp();

export default function handler(req: any, res: any) {
  // Depending on Vercel's routing, the /api prefix may or may not be present.
  // Our Express app mounts routes under /api, so normalize here.
  if (typeof req.url === "string" && !req.url.startsWith("/api")) {
    req.url = `/api${req.url}`;
  }

  return app(req, res);
}
