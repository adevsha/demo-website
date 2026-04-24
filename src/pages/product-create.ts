import { api, ApiError } from "../lib/api.ts";
import { navigate } from "../lib/router.ts";
import { showError } from "../components/error-toast.ts";
import type { Product, ProductCreate } from "../lib/types.ts";

export function renderProductCreate(root: HTMLElement): () => void {
  root.innerHTML = `
    <main class="mx-auto max-w-2xl p-6">
      <div class="mb-4"><a href="/products" data-link class="btn-ghost">← Products</a></div>
      <div class="panel">
        <h1 class="mb-4">New product</h1>
        <form id="create-product-form" class="space-y-4" novalidate>
          <div>
            <label for="create-product-name">Name</label>
            <input id="create-product-name" type="text" required data-testid="create_product_name" />
          </div>
          <div>
            <label for="create-product-description">Description</label>
            <textarea id="create-product-description" rows="3" required data-testid="create_product_description"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="create-product-price">Price</label>
              <input id="create-product-price" type="number" step="0.01" min="0" required data-testid="create_product_price" />
            </div>
            <div>
              <label for="create-product-stock">Stock</label>
              <input id="create-product-stock" type="number" step="1" min="0" value="0" required data-testid="create_product_stock" />
            </div>
          </div>
          <label class="flex items-center gap-2">
            <input id="create-product-in-stock" type="checkbox" checked data-testid="create_product_in_stock" class="h-4 w-4 rounded border-warm-border text-accent focus:ring-accent" />
            <span class="text-sm text-warm-text">In stock</span>
          </label>
          <div class="flex items-center justify-end gap-2">
            <a href="/products" data-link class="btn-secondary">Cancel</a>
            <button type="submit" class="btn-primary" data-testid="create_product_submit">Create product</button>
          </div>
        </form>
      </div>
    </main>
  `;

  const form = root.querySelector<HTMLFormElement>("#create-product-form")!;
  const nameInput = form.querySelector<HTMLInputElement>("#create-product-name")!;
  const descInput = form.querySelector<HTMLTextAreaElement>("#create-product-description")!;
  const priceInput = form.querySelector<HTMLInputElement>("#create-product-price")!;
  const stockInput = form.querySelector<HTMLInputElement>("#create-product-stock")!;
  const inStockInput = form.querySelector<HTMLInputElement>("#create-product-in-stock")!;
  const submitBtn = form.querySelector<HTMLButtonElement>("button[type=submit]")!;

  const onSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault();
    const body: ProductCreate = {
      name: nameInput.value.trim(),
      description: descInput.value.trim(),
      price: Number(priceInput.value),
      stock: Number(stockInput.value),
      in_stock: inStockInput.checked,
    };
    if (!body.name || !body.description || !Number.isFinite(body.price)) {
      showError("Please fill in name, description, and a valid price.");
      return;
    }
    submitBtn.disabled = true;
    try {
      await api<Product>("/products/", { method: "POST", body });
      navigate("/products");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : String(err);
      showError(message);
    } finally {
      submitBtn.disabled = false;
    }
  };

  form.addEventListener("submit", onSubmit);

  return () => {
    form.removeEventListener("submit", onSubmit);
  };
}
