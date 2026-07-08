import { Component, OnInit, inject } from "@angular/core";
import { Router } from "@angular/router";
import { CartUiService } from "../../core/services/cart-ui.service";

/**
 * The cart is now presented as a slide-out drawer (see CartDrawerComponent),
 * rendered globally from the app shell. This route exists only so that
 * direct links / bookmarks to /cart keep working — it opens the drawer over
 * the menu page instead of rendering its own full-page view.
 */
@Component({
  selector: "app-cart",
  standalone: true,
  template: "",
})
export class CartComponent implements OnInit {
  private cartUi = inject(CartUiService);
  private router = inject(Router);

  ngOnInit(): void {
    this.cartUi.open();
    this.router.navigate(["/menu"], { replaceUrl: true });
  }
}
