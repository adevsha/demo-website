const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export async function proxyTo(
  apiBaseUrl: string,
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  const upstreamPath = url.pathname.replace(/^\/api/, "") + url.search;
  const upstreamUrl = `${apiBaseUrl.replace(/\/+$/, "")}${upstreamPath || "/"}`;

  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "host" || HOP_BY_HOP.has(lower)) return;
    forwardHeaders.set(key, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers: forwardHeaders,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(upstreamUrl, init);
    const respHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!HOP_BY_HOP.has(key.toLowerCase())) respHeaders.set(key, value);
    });
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "upstream_unreachable",
        detail: String(err instanceof Error ? err.message : err),
        upstream: upstreamUrl,
      }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
