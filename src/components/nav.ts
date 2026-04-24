import * as auth from "../lib/auth.ts";
import { store } from "../lib/state.ts";
import { navigate } from "../lib/router.ts";

let mounted: HTMLElement | null = null;
let unsubscribe: (() => void) | null = null;

function render(): string {
  if (!auth.isAuthenticated()) return "";
  const user = auth.getUser();
  const email = user?.email ?? "";
  return `
    <nav class="border-b border-warm-border bg-warm-panel">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <a href="/products" data-link class="text-lg font-semibold text-warm-text">Demo Store</a>
        <div class="flex items-center gap-1">
          <a href="/products" data-link data-testid="nav_products" class="btn-ghost">Products</a>
          <a href="/orders" data-link data-testid="nav_orders" class="btn-ghost">Orders</a>
          <a href="/profile" data-link data-testid="nav_profile" class="btn-ghost">Profile</a>
        </div>
        <div class="flex items-center gap-3">
          <span class="hidden text-sm text-warm-sub sm:inline">${escapeHtml(email)}</span>
          <button type="button" data-testid="logout_button" class="btn-secondary" id="nav-logout">Logout</button>
        </div>
      </div>
    </nav>
  `;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function attach(container: HTMLElement): void {
  container.innerHTML = render();
  const btn = container.querySelector<HTMLButtonElement>("#nav-logout");
  btn?.addEventListener("click", () => {
    auth.logout();
    navigate("/login");
  });
}

export function mountNav(container: HTMLElement): void {
  mounted = container;
  attach(container);
  unsubscribe?.();
  unsubscribe = store.subscribe(() => {
    if (mounted) attach(mounted);
  });
}
