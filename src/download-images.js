/**
 * download-images.js
 * Downloads category and hero images from Unsplash CDN into the Angular assets folder.
 * No extra npm packages required – uses only built-in Node.js modules.
 * Run from the project root: node src/download-images.js
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const CATEGORIES_DIR = path.join(
  __dirname,
  "../client/src/assets/categories"
);
const ASSETS_DIR = path.join(__dirname, "../client/src/assets");

// Specific Unsplash photo IDs chosen to match an elegant kosher catering vibe.
const IMAGES = [
  {
    filename: path.join(ASSETS_DIR, "hero.jpg"),
    url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=1400&q=85&fit=crop",
    label: "hero",
  },
  {
    filename: path.join(CATEGORIES_DIR, "goldis.jpg"),
    url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&fit=crop",
    label: "גולדיס",
  },
  {
    filename: path.join(CATEGORIES_DIR, "serving-trays.jpg"),
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80&fit=crop",
    label: "מגשי אירוח",
  },
  {
    filename: path.join(CATEGORIES_DIR, "bakery.jpg"),
    url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80&fit=crop",
    label: "בייקרי",
  },
  {
    filename: path.join(CATEGORIES_DIR, "meats.jpg"),
    url: "https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80&fit=crop",
    label: "בשרים",
  },
  {
    filename: path.join(CATEGORIES_DIR, "fish.jpg"),
    url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80&fit=crop",
    label: "דגים",
  },
  {
    filename: path.join(CATEGORIES_DIR, "salads.jpg"),
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80&fit=crop",
    label: "סלטים",
  },
  {
    filename: path.join(CATEGORIES_DIR, "sides.jpg"),
    url: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80&fit=crop",
    label: "תוספות",
  },
  {
    filename: path.join(CATEGORIES_DIR, "desserts.jpg"),
    url: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80&fit=crop",
    label: "קינוחים",
  },
  {
    filename: path.join(CATEGORIES_DIR, "wine-and-alcohol.jpg"),
    url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80&fit=crop",
    label: "יין ואלכוהול",
  },
];

// Follows HTTP/HTTPS redirects and saves response body to dest.
function downloadFile(url, dest, label) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    const makeRequest = (currentUrl) => {
      const client = currentUrl.startsWith("https://") ? https : http;

      client
        .get(currentUrl, (res) => {
          // Follow redirect
          if (
            (res.statusCode === 301 ||
              res.statusCode === 302 ||
              res.statusCode === 307 ||
              res.statusCode === 308) &&
            res.headers.location
          ) {
            res.resume();
            makeRequest(res.headers.location);
            return;
          }

          if (res.statusCode !== 200) {
            file.close();
            fs.unlink(dest, () => {});
            reject(
              new Error(
                `[${label}] HTTP ${res.statusCode} from ${currentUrl}`
              )
            );
            return;
          }

          res.pipe(file);
          file.on("finish", () => {
            file.close(() => {
              const size = fs.statSync(dest).size;
              console.log(
                `  ✓  ${label.padEnd(20)} → ${path.basename(dest)}  (${Math.round(size / 1024)} KB)`
              );
              resolve();
            });
          });
        })
        .on("error", (err) => {
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`[${label}] Network error: ${err.message}`));
        });
    };

    makeRequest(url);
  });
}

async function main() {
  // Create directories if they don't exist
  [ASSETS_DIR, CATEGORIES_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });

  console.log(`\nDownloading ${IMAGES.length} images...\n`);

  const results = await Promise.allSettled(
    IMAGES.map(({ url, filename, label }) =>
      downloadFile(url, filename, label)
    )
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error("\nFailed downloads:");
    failed.forEach((r) => console.error(" ✗ ", r.reason.message));
    process.exitCode = 1;
  } else {
    console.log("\nAll images downloaded successfully.");
  }
}

main();
