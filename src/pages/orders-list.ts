import { api, ApiError } from "../lib/api.ts";
import * as auth from "../lib/auth.ts";
import { loadingMarkup } from "../components/loading.ts";
import { showError } from "../components/error-toast.ts";
import type { UserOrders, Order } from "../lib/types.ts";

export function renderOrdersList(root: HTMLElement): () => void {
  let disposed = false;

  root.innerHTML = `
    <main class="mx-auto max-w-4xl p-6">
      <h1 class="mb-4">Your orders</h1>
      <div id="orders-body">${loadingMarkup("Loading orders...")}</div>
    </main>
  `;

  const body = root.querySelector<HTMLElement>("#orders-body")!;
  const user = auth.getUser();
  if (!user) {
    body.innerHTML = `<p class="p-4 text-red-700">Not signed in.</p>`;
    return () => {};
  }

  const load = async () => {
    try {
      const data = await api<UserOrders>(`/users/${user.user_id}/orders`);
      if (disposed) return;
      body.innerHTML = renderOrdersView(data);
    } catch (err) {
      if (disposed) return;
      const message = err instanceof ApiError ? err.message : String(err);
      showError(message);
      body.innerHTML = `<p class="p-4 text-warm-sub">Unable to load orders.</p>`;
    }
  };

  void load();

  return () => {
    disposed = true;
  };
}

function renderOrdersView(data: UserOrders): string {
  const top = data.top_product
    ? `${escapeHtml(data.top_product.product_name)} (×${data.top_product.total_quantity})`
    : "No orders yet";
  return `
    <div class="space-y-6">
      <section class="panel grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-warm-muted">Orders</p>
          <p class="text-2xl font-semibold text-warm-text">${data.order_count}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-warm-muted">Total spent</p>
          <p class="text-2xl font-semibold text-accent">$${data.total_spent.toFixed(2)}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-warm-muted">Top product</p>
          <p class="text-sm font-medium text-warm-text">${top}</p>
        </div>
      </section>
      ${data.orders.length === 0
        ? `<p class="p-4 text-warm-sub">No orders yet. <a href="/products" data-link>Browse products</a>.</p>`
        : `<ul class="space-y-3" role="list">${[...data.orders].reverse().map(renderOrderRow).join("")}</ul>`}
    </div>
  `;
}

function renderOrderRow(order: Order): string {
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const itemsSummary = order.items
    .slice(0, 3)
    .map((i) => `${escapeHtml(i.product_name)} ×${i.quantity}`)
    .join(", ");
  const more = order.items.length > 3 ? ` +${order.items.length - 3} more` : "";
  return `
    <li>
      <a href="/orders/${order.id}" data-link data-testid="order_row_${order.id}" class="card flex items-center justify-between gap-4 no-underline">
        <div>
          <p class="font-semibold text-warm-text">Order #${order.id}</p>
          <p class="text-sm text-warm-sub">${escapeHtml(itemsSummary)}${more}</p>
          <p class="text-xs text-warm-muted">${formatDate(order.created_at)} · ${itemCount} item${itemCount === 1 ? "" : "s"}</p>
        </div>
        <div class="text-right">
          <p class="text-lg font-semibold text-accent">$${order.total.toFixed(2)}</p>
        </div>
      </a>
    </li>
  `;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
