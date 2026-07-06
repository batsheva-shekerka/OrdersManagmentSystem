require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Category = require("./models/category.model");
const Product = require("./models/product.model");

const meatProducts = [
  {
    name: "כריך שניצל בחלה",
    imageFile: "KARICH.jpg",
    price: 72,
    description:
      "שניצל עסיסי ופריך, מוגש בין פרוסות חלה טרייה מהתנור. רוטב ביתי עדין, ירקות טריים ונגיעה של תבלין סודי שמשלים כל ביס באלגנטיות.",
  },
  {
    name: "כריך בשר טחון חם",
    imageFile: "KARICH2.jpg",
    price: 68,
    description:
      "בשר טחון איכותי, מתובל בדיוק ונצלה עד לשלמות. הכריך מוגש חם ורך, עם רוטב עשיר, בצל מקורמל וטעם ביתי שמרגישים מיד.",
  },
  {
    name: "כריך אסאדו מפורק",
    imageFile: "KARICH3.jpg",
    price: 89,
    description:
      "אסאדו בבישול איטי וארוך, עד שהבשר נמס בפה ונפרק בקלות. מוגש בלחם רך עם רוטב יין עמוק, שמן זית מיושן ונגיעה של עשבי תיבול.",
  },
  {
    name: "פיצה בשר טחון",
    imageFile: "PIAZZA2.jpg",
    price: 85,
    description:
      "בסיס פיצה איטלקי דק ופריך, מכוסה בשכבה נדיבה של בשר טחון מתובל, גבינה מותכת ורוטב עגבניות ביתי. מנה מלאה, עשירה ומפנקת.",
  },
  {
    name: "פיצה שווארמה",
    imageFile: "PIZZA.jpg",
    price: 78,
    description:
      "פרוסות שווארמה עסיסיות על גבי בצק פריך, עם טחינה קרמית, בצל, עגבניות ותיבול מזרחי עדין. שילוב מפתיע של טעמים קלאסיים ומודרניים.",
  },
  {
    name: "פיצה בשר מפורק",
    imageFile: "PIZZA3.jpg",
    price: 95,
    description:
      "בשר מפורק בבישול ארוך, מפוזר על פיצה איכותית עם גבינות נבחרות ורוטב ביתי. מנה חגיגית, מלאה בטעם ומתאימה לכל אירוע מיוחד.",
  },
];

async function seedMeatProducts() {
  await connectDB();

  const meatsCategory = await Category.findOne({
    $or: [{ slug: "meats" }, { name: "בשרים" }],
  });

  if (!meatsCategory) {
    console.error(
      "Category 'בשרים' not found. Run `npm run seed:categories` first."
    );
    await mongoose.connection.close();
    process.exit(1);
  }

  console.log(`Found category: ${meatsCategory.name} (${meatsCategory._id})`);

  let inserted = 0;
  let updated = 0;

  for (const item of meatProducts) {
    const payload = {
      name: item.name,
      description: item.description,
      price: item.price,
      category: meatsCategory._id,
      imageUrl: `/assets/PRODUCTS/${item.imageFile}`,
      status: "available",
      stock: 50,
      isActive: true,
    };

    const result = await Product.findOneAndUpdate(
      { name: item.name },
      payload,
      { new: true, runValidators: true, upsert: true }
    );

    if (result.createdAt?.getTime() === result.updatedAt?.getTime()) {
      console.log(`  +     ${item.name}  (${item.price} NIS)`);
      inserted += 1;
    } else {
      console.log(`  update ${item.name}  (${item.price} NIS)`);
      updated += 1;
    }
  }

  console.log(`\nDone. Inserted ${inserted}, updated ${updated}.`);
  await mongoose.connection.close();
  process.exit(0);
}

seedMeatProducts().catch((err) => {
  console.error("Meat products seed failed:", err);
  process.exit(1);
});
