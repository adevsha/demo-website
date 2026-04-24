import { api, ApiError } from "../lib/api.ts";
import { navigate } from "../lib/router.ts";
import { loadingMarkup } from "../components/loading.ts";
import { showError } from "../components/error-toast.ts";
import type { Order } from "../lib/types.ts";

export function renderOrderDetail(
  root: HTMLElement,
  params: Record<string, string>,
): () => void {
  let disposed = false;
  const orderId = Number(params["id"]);

  root.innerHTML = `
    <main class="mx-auto max-w-3xl p-6">
      <div class="mb-4"><a href="/orders" data-link class="btn-ghost">← Orders</a></div>
      <div id="order-body">${loadingMarkup("Loading order...")}</div>
    </main>
  `;

  const body = root.querySelector<HTMLElement>("#order-body")!;

  if (!Number.isFinite(orderId)) {
    body.innerHTML = `<p class="p-4 text-red-700">Invalid order id.</p>`;
    return () => {};
  }

  const load = async () => {
    try {
      const order = await api<Order>(`/orders/${orderId}`);
      if (disposed) return;
      body.innerHTML = renderOrderView(order);
      wireDelete(body, order.id);
    } catch (err) {
      if (disposed) return;
      const message = err instanceof ApiError ? err.message : String(err);
      showError(message);
      body.innerHTML = `<p class="p-4 text-warm-sub">Unable to load order.</p>`;
    }
  };

  void load();

  return () => {
    disposed = true;
  };
}

function renderOrderView(order: Order): string {
  return `
    <article class="panel space-y-4">
      <div class="flex items-start justify-between">
        <div>
          <h1>Order #${order.id}</h1>
          <p class="text-sm text-warm-sub">Placed by ${escapeHtml(order.user_name)}</p>
        </div>
        <div class="text-right">
          <p class="text-xs uppercase text-warm-muted">Total</p>
          <p class="text-2xl font-semibold text-accent" data-testid="order_detail_total">$${order.total.toFixed(2)}</p>
        </div>
      </div>
      <p class="text-sm text-warm-sub">
        Placed
        <span data-testid="order_detail_created_at">${formatDate(order.created_at)}</span>
      </p>
      <ul class="divide-y divide-warm-border" role="list">
        ${order.items.map(renderItem).join("")}
      </ul>
      <div class="flex justify-end">
        <button type="button" class="btn-danger" data-testid="order_detail_delete" id="delete-order-btn">
          Delete order
        </button>
      </div>
    </article>
  `;
}

function renderItem(item: Order["items"][number]): string {
  return `
    <li class="flex items-center justify-between gap-4 py-3">
      <div>
        <p class="font-semibold text-warm-text">${escapeHtml(item.product_name)}</p>
        <p class="text-sm text-warm-sub">$${item.price.toFixed(2)} × ${item.quantity}</p>
      </div>
      <p class="font-semibold text-warm-text">$${(item.price * item.quantity).toFixed(2)}</p>
    </li>
  `;
}

function wireDelete(container: HTMLElement, orderId: number): void {
  const btn = container.querySelector<HTMLButtonElement>("#delete-order-btn");
  btn?.addEventListener("click", async () => {
    if (!confirm(`Delete order #${orderId}? This cannot be undone.`)) return;
    btn.disabled = true;
    try {
      await api(`/orders/${orderId}`, { method: "DELETE" });
      navigate("/orders");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : String(err);
      showError(message);
      btn.disabled = false;
    }
  });
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
