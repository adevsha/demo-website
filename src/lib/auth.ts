import { api } from "./api.ts";
import { store, type AuthUser } from "./state.ts";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

export async function login(email: string, password: string): Promise<void> {
  const res = await api<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  store.setToken(res.access_token);
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
