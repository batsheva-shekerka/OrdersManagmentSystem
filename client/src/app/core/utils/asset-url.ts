import { environment } from "../../../environments/environment";

/**
 * Resolves a product/category image path to a URL the browser can actually
 * load. Paths under `/assets/...` are bundled with the Angular app and are
 * used as-is. Paths under `/uploads/...` are written by the Express
 * backend (via multer, see product create/update) and are only served from
 * the API's own origin — not the Angular dev server — so that origin is
 * prefixed explicitly.
 */
export function resolveAssetUrl(path?: string): string {
  if (!path) return "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized.startsWith("/uploads/")) {
    const apiOrigin = environment.apiUrl.replace(/\/api\/?$/, "");
    return `${apiOrigin}${normalized}`;
  }
  return normalized;
}
