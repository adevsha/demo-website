import { api, ApiError } from "../lib/api.ts";
import { store } from "../lib/state.ts";
import { loadingMarkup } from "../components/loading.ts";
import { showError } from "../components/error-toast.ts";
import type { Product } from "../lib/types.ts";

export function renderProductDetail(
  root: HTMLElement,
  params: Record<string, string>,
): () => void {
  let disposed = false;
  const productId = Number(params["id"]);

  root.innerHTML = `
    <main class="mx-auto max-w-3xl p-6">
      <div class="mb-4"><a href="/products" data-link class="btn-ghost">← Products</a></div>
      <div id="detail-body">${loadingMarkup("Loading product...")}</div>
    </main>
  `;

  const body = root.querySelector<HTMLElement>("#detail-body")!;

  if (!Number.isFinite(productId)) {
    body.innerHTML = `<p class="p-4 text-red-700">Invalid product id.</p>`;
    return () => {};
  }

  const load = async () => {
    try {
      const product = await api<Product>(`/products/${productId}`);
      if (disposed) return;
      body.innerHTML = renderDetail(product);
      wireAddToCart(body, product);
    } catch (err) {
      if (disposed) return;
      const message = err instanceof ApiError ? err.message : String(err);
      showError(message);
      body.innerHTML = `<p class="p-4 text-warm-sub">Unable to load product.</p>`;
    }
  };

  void load();

  return () => {
    disposed = true;
  };
}

function renderDetail(product: Product): string {
  const badge = product.in_stock
    ? `<span class="badge-in-stock" data-testid="product_detail_in_stock">In stock</span>`
    : `<span class="badge-out-of-stock" data-testid="product_detail_in_stock">Out of stock</span>`;
  return `
    <article class="panel space-y-4">
      <div class="flex items-start justify-between gap-4">
        <h1 data-testid="product_detail_name">${escapeHtml(product.name)}</h1>
        ${badge}
      </div>
      <p class="text-warm-sub" data-testid="product_detail_description">${escapeHtml(product.description)}</p>
      <dl class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt class="text-warm-muted">Price</dt>
          <dd class="text-lg font-semibold text-accent" data-testid="product_detail_price">$${product.price.toFixed(2)}</dd>
        </div>
        <div>
          <dt class="text-warm-muted">Stock</dt>
          <dd class="text-lg font-semibold text-warm-text" data-testid="product_detail_stock">${product.stock}</dd>
        </div>
      </dl>
      <div class="flex gap-3">
        <button
          type="button"
          class="btn-primary"
          data-testid="product_detail_add_to_cart"
          id="add-to-cart-btn"
          ${product.in_stock ? "" : "disabled"}
        >
          Add to cart
        </button>
        <a href="/checkout" data-link class="btn-secondary">View cart</a>
      </div>
    </article>
  `;
}

function wireAddToCart(container: HTMLElement, product: Product): void {
  const btn = container.querySelector<HTMLButtonElement>("#add-to-cart-btn");
  btn?.addEventListener("click", () => {
    store.addItem(product.id, 1);
    btn.textContent = "Added ✓";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = "Add to cart";
      btn.disabled = !product.in_stock;
    }, 1200);
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
