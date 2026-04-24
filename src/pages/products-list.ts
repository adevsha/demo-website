import { api, ApiError } from "../lib/api.ts";
import { navigate } from "../lib/router.ts";
import { loadingMarkup } from "../components/loading.ts";
import { showError } from "../components/error-toast.ts";
import type { Product } from "../lib/types.ts";

export function renderProductsList(root: HTMLElement): () => void {
  let disposed = false;

  root.innerHTML = `
    <main class="mx-auto max-w-6xl p-6">
      <div class="mb-6 flex items-center justify-between gap-4">
        <h1>Products</h1>
        <div class="flex items-center gap-2">
          <button type="button" class="btn-secondary" data-testid="product_list_refresh" id="refresh-btn">Refresh</button>
          <a href="/products/new" data-link class="btn-primary" data-testid="add_product_button">New product</a>
        </div>
      </div>
      <div id="products-body">${loadingMarkup("Loading products...")}</div>
    </main>
  `;

  const body = root.querySelector<HTMLElement>("#products-body")!;
  const refreshBtn = root.querySelector<HTMLButtonElement>("#refresh-btn")!;

  const load = async () => {
    body.innerHTML = loadingMarkup("Loading products...");
    try {
      const products = await api<Product[]>("/products/");
      if (disposed) return;
      body.innerHTML = renderList(products);
      wireRowClicks(body);
    } catch (err) {
      if (disposed) return;
      const message = err instanceof ApiError ? err.message : String(err);
      showError(message);
      body.innerHTML = `<p class="p-4 text-warm-sub">Unable to load products.</p>`;
    }
  };

  refreshBtn.addEventListener("click", () => void load());
  void load();

  return () => {
    disposed = true;
  };
}

function renderList(products: Product[]): string {
  if (products.length === 0) {
    return `<p class="p-4 text-warm-sub">No products yet.</p>`;
  }
  return `
    <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
      ${products.map(renderCard).join("")}
    </ul>
  `;
}

function renderCard(product: Product): string {
  const stockBadge = product.in_stock
    ? `<span class="badge-in-stock" data-testid="product_row_in_stock">In stock</span>`
    : `<span class="badge-out-of-stock" data-testid="product_row_in_stock">Out of stock</span>`;
  return `
    <li>
      <a
        href="/products/${product.id}"
        data-link
        data-testid="product_row_${product.id}"
        class="card flex h-full flex-col gap-2 no-underline"
        data-product-id="${product.id}"
      >
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-base font-semibold text-warm-text" data-testid="product_row_name">${escapeHtml(product.name)}</h3>
          ${stockBadge}
        </div>
        <p class="flex-1 text-sm text-warm-sub">${escapeHtml(truncate(product.description, 120))}</p>
        <p class="text-lg font-semibold text-accent" data-testid="product_row_price">${formatPrice(product.price)}</p>
      </a>
    </li>
  `;
}

function wireRowClicks(container: HTMLElement): void {
  container.querySelectorAll<HTMLAnchorElement>("a[data-product-id]").forEach((link) => {
    link.addEventListener("click", (ev) => {
      ev.preventDefault();
      const id = link.dataset["productId"];
      if (id) navigate(`/products/${id}`);
    });
  });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
