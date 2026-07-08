import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { adminGuard } from "./core/guards/admin.guard";

export const routes: Routes = [
  { path: "", redirectTo: "menu", pathMatch: "full" },
  {
    path: "menu",
    loadComponent: () =>
      import("./features/menu/menu.component").then((m) => m.MenuComponent),
  },
  {
    path: "category/:categoryId",
    loadComponent: () =>
      import("./features/menu/category-products.component").then(
        (m) => m.CategoryProductsComponent
      ),
  },
  {
    path: "cart",
    loadComponent: () =>
      import("./features/cart/cart.component").then((m) => m.CartComponent),
  },
  {
    path: "checkout",
    loadComponent: () =>
      import("./features/checkout/checkout.component").then(
        (m) => m.CheckoutComponent
      ),
  },
  {
    path: "auth/login",
    loadComponent: () =>
      import("./features/auth/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "auth/register",
    loadComponent: () =>
      import("./features/auth/register.component").then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: "orders",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/orders/orders.component").then(
        (m) => m.OrdersComponent
      ),
  },
  { path: "admin", redirectTo: "admin/dashboard" },
  {
    path: "admin/dashboard",
    canActivate: [adminGuard],
    loadComponent: () =>
      import("./features/admin/admin-dashboard.component").then(
        (m) => m.AdminDashboardComponent
      ),
  },
  {
    path: "admin/products",
    canActivate: [adminGuard],
    loadComponent: () =>
      import("./features/admin/admin-products.component").then(
        (m) => m.AdminProductsComponent
      ),
  },
  { path: "**", redirectTo: "menu" },
];
