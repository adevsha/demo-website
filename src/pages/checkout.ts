import { api, ApiError } from "../lib/api.ts";
import { store, type CartItem } from "../lib/state.ts";
import { navigate } from "../lib/router.ts";
import { loadingMarkup } from "../components/loading.ts";
import { showError } from "../components/error-toast.ts";
import type { CheckoutRequest, CheckoutResponse, Product } from "../lib/types.ts";

type CartRow = CartItem & { product: Product };

export function renderCheckout(root: HTMLElement): () => void {
  let disposed = false;

  root.innerHTML = `
    <main class="mx-auto max-w-3xl p-6">
      <h1 class="mb-4">Checkout</h1>
      <div id="checkout-body">${loadingMarkup("Loading cart...")}</div>
    </main>
  `;

  const body = root.querySelector<HTMLElement>("#checkout-body")!;

  const boot = async () => {
    const items = store.getCart();
    if (items.length === 0) {
      body.innerHTML = emptyState();
      return;
    }
    try {
      const products = await Promise.all(
        items.map((item) =>
          api<Product>(`/products/${item.product_id}`).catch(() => null),
        ),
      );
      if (disposed) return;
      const rows: CartRow[] = items
        .map((item, idx) => {
          const product = products[idx];
          if (!product) return null;
          return { ...item, product };
        })
        .filter((row): row is CartRow => row !== null);
      if (rows.length === 0) {
        body.innerHTML = emptyState();
        return;
      }
      renderCart(body, rows);
    } catch (err) {
      if (disposed) return;
      const message = err instanceof ApiError ? err.message : String(err);
      showError(message);
      body.innerHTML = `<p class="p-4 text-warm-sub">Unable to load cart.</p>`;
    }
  };

  void boot();

  return () => {
    disposed = true;
  };
}

function emptyState(): string {
  return `
    <div class="panel text-center">
      <p class="text-warm-sub">Your cart is empty.</p>
      <a href="/products" data-link class="btn-primary mt-4 inline-block">Browse products</a>
    </div>
  `;
}

function renderCart(body: HTMLElement, rows: CartRow[]): void {
  const subtotal = rows.reduce(
    (sum, row) => sum + row.product.price * row.quantity,
    0,
  );
  body.innerHTML = `
    <div class="space-y-6">
      <ul class="panel divide-y divide-warm-border" role="list">
        ${rows.map(renderRow).join("")}
      </ul>
      <div class="panel flex items-center justify-between">
        <span class="text-warm-sub">Subtotal</span>
        <span class="text-lg font-semibold text-warm-text" id="checkout-subtotal">$${subtotal.toFixed(2)}</span>
      </div>
      <form id="checkout-form" class="panel space-y-4" novalidate>
        <div>
          <label for="checkout-discount">Discount code (optional)</label>
          <input id="checkout-discount" type="text" placeholder="WELCOME10 or SAVE20" data-testid="checkout_discount_input" />
        </div>
        <div class="flex items-center justify-end gap-2">
          <a href="/products" data-link class="btn-secondary">Keep shopping</a>
          <button type="submit" class="btn-primary" data-testid="checkout_submit">Place order</button>
        </div>
        <div id="checkout-result" class="hidden rounded-md border border-warm-border bg-accent-light p-4"></div>
      </form>
    </div>
  `;

  wireQuantityControls(body);
  wireCheckout(body, rows);
}

function renderRow(row: CartRow): string {
  const lineTotal = row.product.price * row.quantity;
  return `
    <li class="flex items-center gap-4 py-3" data-testid="checkout_item_${row.product.id}">
      <div class="flex-1">
        <p class="font-semibold text-warm-text" data-testid="checkout_item_${row.product.id}_name">${escapeHtml(row.product.name)}</p>
        <p class="text-sm text-warm-sub">$${row.product.price.toFixed(2)} each</p>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="btn-ghost px-2" data-action="dec" data-product="${row.product.id}" aria-label="Decrease quantity">−</button>
        <span class="min-w-[2ch] text-center font-semibold" data-testid="checkout_item_${row.product.id}_quantity">${row.quantity}</span>
        <button type="button" class="btn-ghost px-2" data-action="inc" data-product="${row.product.id}" aria-label="Increase quantity">+</button>
      </div>
      <div class="min-w-[5rem] text-right">
        <p class="font-semibold text-accent" data-testid="checkout_item_${row.product.id}_price">$${lineTotal.toFixed(2)}</p>
      </div>
      <button type="button" class="btn-ghost text-warm-muted" data-action="remove" data-product="${row.product.id}" aria-label="Remove">✕</button>
    </li>
  `;
}

function wireQuantityControls(body: HTMLElement): void {
  body.querySelectorAll<HTMLButtonElement>("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset["action"];
      const productId = Number(btn.dataset["product"]);
      if (!Number.isFinite(productId)) return;
      const current = store
        .getCart()
        .find((c) => c.product_id === productId)?.quantity ?? 0;
      if (action === "inc") store.setQuantity(productId, current + 1);
      else if (action === "dec") store.setQuantity(productId, Math.max(0, current - 1));
      else if (action === "remove") store.removeItem(productId);
      navigate("/checkout", true);
    });
  });
}

function wireCheckout(body: HTMLElement, _rows: CartRow[]): void {
  const form = body.querySelector<HTMLFormElement>("#checkout-form");
  const discountInput = body.querySelector<HTMLInputElement>("#checkout-discount");
  const result = body.querySelector<HTMLElement>("#checkout-result");
  if (!form || !discountInput || !result) return;

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const submitBtn = form.querySelector<HTMLButtonElement>("button[type=submit]");
    if (submitBtn) submitBtn.disabled = true;
    const items = store.getCart();
    if (items.length === 0) {
      showError("Your cart is empty.");
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
    const discount = discountInput.value.trim();
    const reqBody: CheckoutRequest = {
      items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    };
    if (discount) reqBody.discount_code = discount;
    try {
      const res = await api<CheckoutResponse>("/checkout/", {
        method: "POST",
        body: reqBody,
      });
      result.classList.remove("hidden");
      result.innerHTML = `
        <p class="font-semibold text-warm-text">Order placed!</p>
        <p class="mt-1 text-sm text-warm-sub">Confirmation: <span data-testid="checkout_confirmation_number" class="font-mono text-warm-text">${escapeHtml(res.confirmation_number)}</span></p>
        <p class="text-sm text-warm-sub">Discount applied: <span data-testid="checkout_discount_applied" class="font-semibold text-accent">$${res.discount_applied.toFixed(2)}</span></p>
        <p class="text-sm text-warm-sub">Total: <span class="font-semibold text-accent">$${res.order.total.toFixed(2)}</span></p>
        <div class="mt-4 flex gap-2">
          <a href="/orders/${res.order.id}" data-link class="btn-primary">View order</a>
          <a href="/products" data-link class="btn-secondary">Continue shopping</a>
        </div>
      `;
      store.clearCart();
      form.querySelector<HTMLButtonElement>("button[type=submit]")!.disabled = true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : String(err);
      showError(message);
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
