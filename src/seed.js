require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/user.model");
const Category = require("./models/category.model");
const Product = require("./models/product.model");
const PointsTier = require("./models/pointsTier.model");

async function seed() {
  await connectDB();

  let admin = await User.findOne({ email: "admin@goldis.com" });
  if (!admin) {
    admin = new User({
      name: "Shop Admin",
      email: "admin@goldis.com",
      role: "admin",
    });
    await admin.setPassword("admin123");
    await admin.save();
    console.log("Created admin -> email: admin@goldis.com  password: admin123");
  } else {
    console.log("Admin already exists (admin@goldis.com)");
  }

  let category = await Category.findOne({ name: "Burgers" });
  if (!category) {
    category = await Category.create({
      name: "Burgers",
      description: "Juicy house burgers",
      displayOrder: 1,
    });
    console.log("Created category: Burgers");
  }

  if ((await Product.countDocuments()) === 0) {
    await Product.create([
      {
        name: "Classic Burger",
        description: "Beef patty, lettuce, tomato",
        price: 45,
        category: category._id,
        stock: 100,
        status: "available",
      },
      {
        name: "Cheese Burger",
        description: "Classic with melted cheddar",
        price: 52,
        category: category._id,
        stock: 80,
        status: "available",
      },
      {
        name: "Veggie Burger",
        description: "Plant-based patty",
        price: 40,
        category: category._id,
        stock: 50,
        status: "available",
      },
    ]);
    console.log("Created 3 products");
  } else {
    console.log("Products already exist (skipping)");
  }

  if ((await PointsTier.countDocuments()) === 0) {
    await PointsTier.create([
      { name: "Tier 1", minAmount: 0, maxAmount: 100, pointsPercentage: 5 },
      { name: "Tier 2", minAmount: 100, maxAmount: 300, pointsPercentage: 8 },
      { name: "Tier 3", minAmount: 300, maxAmount: null, pointsPercentage: 10 },
    ]);
    console.log("Created 3 points tiers");
  } else {
    console.log("Points tiers already exist (skipping)");
  }

  await mongoose.connection.close();
  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
