export type AuthUser = {
  user_id: number;
  email: string;
  exp: number;
};

export type CartItem = {
  product_id: number;
  quantity: number;
};

type Listener = () => void;

const TOKEN_KEY = "demo.auth.token";
const CART_KEY = "demo.cart";

class Store {
  private token: string | null = null;
  private user: AuthUser | null = null;
  private cart: CartItem[] = [];
  private listeners = new Set<Listener>();

  constructor() {
    if (typeof localStorage !== "undefined") {
      this.token = localStorage.getItem(TOKEN_KEY);
      if (this.token) this.user = decodeJwt(this.token);
      const rawCart = localStorage.getItem(CART_KEY);
      if (rawCart) {
        try {
          this.cart = JSON.parse(rawCart) as CartItem[];
        } catch {
          this.cart = [];
        }
      }
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    for (const fn of this.listeners) fn();
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  setToken(token: string): void {
    this.token = token;
    this.user = decodeJwt(token);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
    this.notify();
  }

  clearToken(): void {
    this.token = null;
    this.user = null;
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
    this.notify();
  }

  getCart(): CartItem[] {
    return [...this.cart];
  }

  addItem(product_id: number, quantity = 1): void {
    const existing = this.cart.find((c) => c.product_id === product_id);
    if (existing) existing.quantity += quantity;
    else this.cart.push({ product_id, quantity });
    this.persistCart();
    this.notify();
  }

  setQuantity(product_id: number, quantity: number): void {
    if (quantity <= 0) {
      this.cart = this.cart.filter((c) => c.product_id !== product_id);
    } else {
      const existing = this.cart.find((c) => c.product_id === product_id);
      if (existing) existing.quantity = quantity;
      else this.cart.push({ product_id, quantity });
    }
    this.persistCart();
    this.notify();
  }

  removeItem(product_id: number): void {
    this.cart = this.cart.filter((c) => c.product_id !== product_id);
    this.persistCart();
    this.notify();
  }

  clearCart(): void {
    this.cart = [];
    this.persistCart();
    this.notify();
  }

  private persistCart(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(CART_KEY, JSON.stringify(this.cart));
    }
  }
}

function decodeJwt(token: string): AuthUser | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1]!
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(parts[1]!.length + ((4 - (parts[1]!.length % 4)) % 4), "=");
    const decoded = atob(payload);
    const parsed = JSON.parse(decoded) as Partial<AuthUser> & { sub?: string };
    if (typeof parsed.user_id !== "number" || typeof parsed.exp !== "number") {
      return null;
    }
    return {
      user_id: parsed.user_id,
      email: parsed.email ?? parsed.sub ?? "",
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export const store = new Store();
