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
  {
    path: "admin",
    canActivate: [adminGuard],
    loadComponent: () =>
      import("./features/admin/admin.component").then((m) => m.AdminComponent),
  },
  { path: "**", redirectTo: "menu" },
];
