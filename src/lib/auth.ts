import { api } from "./api.ts";
import { store, type AuthUser } from "./state.ts";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

export async function login(email: string, password: string): Promise<void> {
  // Use raw fetch so a 401 (wrong credentials) does not trigger the global
  // session-expired handler in api.ts, which would re-render the login page
  // and orphan the error element before the catch block can show the message.
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    const message =
      typeof (data as { detail?: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : "Login failed";
    throw new Error(message);
  }
  store.setToken((data as LoginResponse).access_token);
}

export function logout(): void {
  store.clearToken();
  store.clearCart();
}

export function getUser(): AuthUser | null {
  return store.getUser();
}

export function isAuthenticated(): boolean {
  const user = store.getUser();
  if (!user) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return user.exp > nowSeconds;
}
