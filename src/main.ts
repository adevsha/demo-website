import { addGuard, addRoute, navigate, start } from "./lib/router.ts";
import { setUnauthorizedHandler } from "./lib/api.ts";
import { isAuthenticated } from "./lib/auth.ts";
import { mountNav } from "./components/nav.ts";
import { renderLogin } from "./pages/login.ts";
import { renderProductsList } from "./pages/products-list.ts";
import { renderProductDetail } from "./pages/product-detail.ts";
import { renderProductCreate } from "./pages/product-create.ts";
import { renderCheckout } from "./pages/checkout.ts";
import { renderOrdersList } from "./pages/orders-list.ts";
import { renderOrderDetail } from "./pages/order-detail.ts";
import { renderProfile } from "./pages/profile.ts";

const PUBLIC_PATHS = new Set(["/login"]);

addGuard((path) => {
  if (!isAuthenticated() && !PUBLIC_PATHS.has(path)) return "/login";
  if (isAuthenticated() && path === "/login") return "/products";
  if (path === "/") return isAuthenticated() ? "/products" : "/login";
  return null;
});

addRoute("/login", renderLogin);
addRoute("/products", renderProductsList);
addRoute("/products/new", renderProductCreate);
addRoute("/products/:id", renderProductDetail);
addRoute("/checkout", renderCheckout);
addRoute("/orders", renderOrdersList);
addRoute("/orders/:id", renderOrderDetail);
addRoute("/profile", renderProfile);

setUnauthorizedHandler(() => navigate("/login", true));

function boot() {
  const appRoot = document.getElementById("app");
  if (!appRoot) throw new Error("#app not found");

  appRoot.innerHTML = `
    <div id="nav-host"></div>
    <div id="route-host"></div>
  `;

  const navHost = appRoot.querySelector<HTMLElement>("#nav-host")!;
  const routeHost = appRoot.querySelector<HTMLElement>("#route-host")!;

  mountNav(navHost);
  start(routeHost);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
