export type PageRenderer = (
  root: HTMLElement,
  params: Record<string, string>,
) => (() => void) | void | Promise<(() => void) | void>;

type RouteEntry = {
  pattern: RegExp;
  keys: string[];
  render: PageRenderer;
};

type Guard = (path: string) => string | null;

const routes: RouteEntry[] = [];
const guards: Guard[] = [];
let currentCleanup: (() => void) | null = null;
let rootEl: HTMLElement | null = null;

function compile(path: string): { pattern: RegExp; keys: string[] } {
  const keys: string[] = [];
  const pattern = path
    .replace(/\/$/, "")
    .replace(/:([A-Za-z_]+)/g, (_, key) => {
      keys.push(key);
      return "([^/]+)";
    });
  return {
    pattern: new RegExp(`^${pattern}/?$`),
    keys,
  };
}

export function addRoute(path: string, render: PageRenderer): void {
  const { pattern, keys } = compile(path);
  routes.push({ pattern, keys, render });
}

export function addGuard(guard: Guard): void {
  guards.push(guard);
}

export function navigate(path: string, replace = false): void {
  if (replace) {
    history.replaceState(null, "", path);
  } else {
    history.pushState(null, "", path);
  }
  void dispatch();
}

export function currentPath(): string {
  return location.pathname || "/";
}

async function dispatch(): Promise<void> {
  if (!rootEl) return;
  const path = currentPath();

  for (const guard of guards) {
    const redirect = guard(path);
    if (redirect && redirect !== path) {
      navigate(redirect, true);
      return;
    }
  }

  const match = routes
    .map((r) => {
      const m = r.pattern.exec(path);
      if (!m) return null;
      const params: Record<string, string> = {};
      r.keys.forEach((key, idx) => {
        params[key] = decodeURIComponent(m[idx + 1] ?? "");
      });
      return { render: r.render, params };
    })
    .find((m) => m !== null);

  if (currentCleanup) {
    try {
      currentCleanup();
    } catch {
      // ignore cleanup errors
    }
    currentCleanup = null;
  }

  rootEl.innerHTML = "";

  if (!match) {
    rootEl.innerHTML = `<main class="mx-auto max-w-2xl p-8"><h1>Not found</h1><p class="text-warm-sub mt-2">No page exists at <code>${path}</code>.</p></main>`;
    return;
  }

  try {
    const cleanup = await match.render(rootEl, match.params);
    if (typeof cleanup === "function") currentCleanup = cleanup;
  } catch (err) {
    console.error("Route render failed:", err);
    rootEl.innerHTML = `<main class="mx-auto max-w-2xl p-8"><h1>Error</h1><p class="text-red-700 mt-2">${String(err instanceof Error ? err.message : err)}</p></main>`;
  }
}

export function start(root: HTMLElement): void {
  rootEl = root;
  window.addEventListener("popstate", () => void dispatch());
  document.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement | null;
    const link = target?.closest("a[data-link]") as HTMLAnchorElement | null;
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("//")) return;
    ev.preventDefault();
    navigate(href);
  });
  void dispatch();
}
