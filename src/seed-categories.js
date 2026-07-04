require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Category = require("./models/category.model");

const categories = [
  { name: "גולדיס",         slug: "goldis",           imageUrl: "/assets/categories/goldis.jpg" },
  { name: "מגשי אירוח",     slug: "serving-trays",    imageUrl: "/assets/categories/serving-trays.jpg" },
  { name: "בייקרי",         slug: "bakery",           imageUrl: "/assets/categories/bakery.jpg" },
  { name: "בשרים",          slug: "meats",            imageUrl: "/assets/categories/meats.jpg" },
  { name: "דגים",           slug: "fish",             imageUrl: "/assets/categories/fish.jpg" },
  { name: "סלטים",          slug: "salads",           imageUrl: "/assets/categories/salads.jpg" },
  { name: "תוספות",         slug: "sides",            imageUrl: "/assets/categories/sides.jpg" },
  { name: "קינוחים",        slug: "desserts",         imageUrl: "/assets/categories/desserts.jpg" },
  { name: "יין ואלכוהול",   slug: "wine-and-alcohol", imageUrl: "/assets/categories/wine-and-alcohol.jpg" },
];

async function seedCategories() {
  await connectDB();

  const existing = await Category.countDocuments();
  if (existing > 0) {
    await Category.deleteMany({});
    console.log(`Cleared ${existing} existing categories.`);
  } else {
    console.log("Categories collection is empty. Inserting fresh set.");
  }

  const docs = categories.map((category, index) => ({
    name: category.name,
    slug: category.slug,
    imageUrl: category.imageUrl,
    isActive: true,
    displayOrder: index + 1,
  }));

  const inserted = await Category.insertMany(docs);
  console.log(`Inserted ${inserted.length} categories:`);
  inserted.forEach((c) => console.log(`  ${c.displayOrder}. ${c.name} (${c.slug})`));

  await mongoose.connection.close();
  console.log("Category seed complete.");
  process.exit(0);
}

seedCategories().catch((err) => {
  console.error("Category seed failed:", err);
  process.exit(1);
});
