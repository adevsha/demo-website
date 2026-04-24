import { file } from "bun";
import { resolve } from "node:path";
import { proxyTo } from "./lib/proxy.ts";

const PORT = Number(process.env.PORT ?? 3000);
const PUBLIC_DIR = process.env.PUBLIC_DIR ?? "dist";
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000";
const ROOT = resolve(import.meta.dir, "..");

type StaticMap = Record<string, string>;

const staticFiles: StaticMap = {
  "/styles.css": `${ROOT}/${PUBLIC_DIR}/styles.css`,
  "/main.js": `${ROOT}/${PUBLIC_DIR}/main.js`,
  "/favicon.ico": `${ROOT}/public/favicon.ico`,
};

const indexHtmlPath = `${ROOT}/src/index.html`;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path.startsWith("/api/") || path === "/api") {
      return proxyTo(API_BASE_URL, req);
    }

    const staticPath = staticFiles[path];
    if (staticPath) {
      const f = file(staticPath);
      if (await f.exists()) return new Response(f);
    }

    if (req.method === "GET" && (path === "/" || !path.includes("."))) {
      return new Response(file(indexHtmlPath), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(
  `demo-website listening on http://localhost:${server.port} → proxying /api/* to ${API_BASE_URL}`,
);
