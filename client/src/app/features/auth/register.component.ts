import { Component, OnInit, inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthUiService } from "../../core/services/auth-ui.service";

/**
 * Login/registration is now presented as a split modal (see AuthModalComponent),
 * rendered globally from the app shell. This route exists only so that direct
 * links / bookmarks to /auth/register keep working — it opens the modal over
 * the menu page instead of rendering its own full-page view.
 */
@Component({
  selector: "app-register",
  standalone: true,
  template: "",
})
export class RegisterComponent implements OnInit {
  private authUi = inject(AuthUiService);
  private router = inject(Router);

  ngOnInit(): void {
    this.authUi.open("register");
    this.router.navigate(["/menu"], { replaceUrl: true });
  }
}
