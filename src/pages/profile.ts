import { api, ApiError } from "../lib/api.ts";
import * as auth from "../lib/auth.ts";
import { loadingMarkup } from "../components/loading.ts";
import { showError } from "../components/error-toast.ts";
import type { User, UserOrders } from "../lib/types.ts";

export function renderProfile(root: HTMLElement): () => void {
  let disposed = false;

  root.innerHTML = `
    <main class="mx-auto max-w-3xl p-6">
      <h1 class="mb-4">Profile</h1>
      <div id="profile-body">${loadingMarkup("Loading profile...")}</div>
    </main>
  `;

  const body = root.querySelector<HTMLElement>("#profile-body")!;
  const me = auth.getUser();
  if (!me) {
    body.innerHTML = `<p class="p-4 text-red-700">Not signed in.</p>`;
    return () => {};
  }

  const load = async () => {
    try {
      const [user, orders] = await Promise.all([
        api<User>(`/users/${me.user_id}`),
        api<UserOrders>(`/users/${me.user_id}/orders`),
      ]);
      if (disposed) return;
      body.innerHTML = renderView(user, orders);
      wireEdit(body, user);
    } catch (err) {
      if (disposed) return;
      const message = err instanceof ApiError ? err.message : String(err);
      showError(message);
      body.innerHTML = `<p class="p-4 text-warm-sub">Unable to load profile.</p>`;
    }
  };

  void load();

  return () => {
    disposed = true;
  };
}

function renderView(user: User, orders: UserOrders): string {
  const top =
    orders.top_product !== null
      ? `${escapeHtml(orders.top_product.product_name)} (×${orders.top_product.total_quantity})`
      : "No orders yet";
  return `
    <div class="space-y-6" id="profile-view">
      <section class="panel space-y-2">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs uppercase tracking-wide text-warm-muted">Name</p>
            <p class="text-lg font-semibold text-warm-text" data-testid="profile_name">${escapeHtml(user.name)}</p>
          </div>
          <button type="button" class="btn-secondary" data-testid="profile_edit_button" id="profile-edit">Edit</button>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-warm-muted">Email</p>
          <p class="text-warm-text" data-testid="profile_email">${escapeHtml(user.email)}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-warm-muted">Age</p>
          <p class="text-warm-text" data-testid="profile_age">${user.age}</p>
        </div>
      </section>
      <section class="panel grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-warm-muted">Orders</p>
          <p class="text-2xl font-semibold text-warm-text" data-testid="profile_order_count">${orders.order_count}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-warm-muted">Total spent</p>
          <p class="text-2xl font-semibold text-accent" data-testid="profile_total_spent">$${orders.total_spent.toFixed(2)}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-warm-muted">Top product</p>
          <p class="text-sm font-medium text-warm-text" data-testid="profile_top_product">${top}</p>
        </div>
      </section>
    </div>
  `;
}

function renderEditForm(user: User): string {
  return `
    <form id="profile-edit-form" class="panel space-y-4" novalidate>
      <h2 class="text-xl">Edit profile</h2>
      <div>
        <label for="profile-edit-name">Name</label>
        <input id="profile-edit-name" type="text" required value="${escapeHtmlAttr(user.name)}" data-testid="profile_edit_name" />
      </div>
      <div>
        <label for="profile-edit-email">Email</label>
        <input id="profile-edit-email" type="email" required value="${escapeHtmlAttr(user.email)}" data-testid="profile_edit_email" />
      </div>
      <div>
        <label for="profile-edit-age">Age</label>
        <input id="profile-edit-age" type="number" min="0" required value="${user.age}" data-testid="profile_edit_age" />
      </div>
      <div class="flex items-center justify-end gap-2">
        <button type="button" class="btn-secondary" data-testid="profile_edit_cancel" id="profile-edit-cancel">Cancel</button>
        <button type="submit" class="btn-primary" data-testid="profile_edit_save">Save</button>
      </div>
    </form>
  `;
}

function wireEdit(container: HTMLElement, user: User): void {
  const editBtn = container.querySelector<HTMLButtonElement>("#profile-edit");
  editBtn?.addEventListener("click", () => {
    const view = container.querySelector<HTMLElement>("#profile-view")!;
    view.innerHTML = renderEditForm(user);
    wireEditForm(view, user);
  });
}

function wireEditForm(container: HTMLElement, user: User): void {
  const form = container.querySelector<HTMLFormElement>("#profile-edit-form");
  const cancel = container.querySelector<HTMLButtonElement>("#profile-edit-cancel");
  const nameEl = container.querySelector<HTMLInputElement>("#profile-edit-name");
  const emailEl = container.querySelector<HTMLInputElement>("#profile-edit-email");
  const ageEl = container.querySelector<HTMLInputElement>("#profile-edit-age");
  if (!form || !cancel || !nameEl || !emailEl || !ageEl) return;

  cancel.addEventListener("click", () => {
    location.reload();
  });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const submitBtn = form.querySelector<HTMLButtonElement>("button[type=submit]");
    if (submitBtn) submitBtn.disabled = true;
    try {
      await api<User>(`/users/${user.id}`, {
        method: "PATCH",
        body: {
          name: nameEl.value.trim(),
          email: emailEl.value.trim(),
          age: Number(ageEl.value),
        },
      });
      location.reload();
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

function escapeHtmlAttr(input: string): string {
  return escapeHtml(input);
}
