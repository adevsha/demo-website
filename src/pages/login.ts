import * as auth from "../lib/auth.ts";
import { ApiError } from "../lib/api.ts";
import { navigate } from "../lib/router.ts";

export function renderLogin(root: HTMLElement): () => void {
  root.innerHTML = `
    <main class="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <div class="panel space-y-4">
        <h1 class="text-2xl">Sign in</h1>
        <p class="text-sm text-warm-sub">Use a seeded account (e.g. alice@example.com / password123).</p>
        <form id="login-form" class="space-y-4" novalidate>
          <div>
            <label for="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              autocomplete="email"
              required
              data-testid="login_email"
            />
          </div>
          <div>
            <label for="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              autocomplete="current-password"
              required
              data-testid="login_password"
            />
          </div>
          <button type="submit" class="btn-primary w-full" data-testid="login_button">
            Sign in
          </button>
          <p data-testid="login_error" class="hidden text-sm text-red-700" role="alert"></p>
        </form>
      </div>
    </main>
  `;

  const form = root.querySelector<HTMLFormElement>("#login-form")!;
  const emailInput = root.querySelector<HTMLInputElement>("#login-email")!;
  const passwordInput =
    root.querySelector<HTMLInputElement>("#login-password")!;
  const submitBtn = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
  const errorEl = root.querySelector<HTMLElement>('[data-testid="login_error"]')!;

  const onSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault();
    errorEl.classList.add("hidden");
    errorEl.textContent = "";
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      errorEl.textContent = "Email and password are required.";
      errorEl.classList.remove("hidden");
      return;
    }
    submitBtn.disabled = true;
    try {
      await auth.login(email, password);
      navigate("/products");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Login failed";
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
    }
  };

  form.addEventListener("submit", onSubmit);

  return () => {
    form.removeEventListener("submit", onSubmit);
  };
}
