require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Category = require("./models/category.model");
const Product = require("./models/product.model");

const CATEGORY_NAME = "מגשי אירוח";
const CATEGORY_SLUG = "catering-platters";

const cateringProducts = [
  {
    name: "מגש מיקס בשרי ומאפים מלוחים",
    imageFile: "meal.jpg",
    price: 289,
    description:
      "מגש אירוח עשיר ומרשים עם שילוב נדיב של מאפים מלוחים, נתחי בשר עסיסיים ונגיעות שף אלגנטיות. מתאים לאירוח פרימיום שבו כל ביס מרגיש מוקפד, טרי ושופע.",
  },
  {
    name: "מגש כוסיות סלטי שף אישיים",
    imageFile: "vegtabels.webp",
    price: 165,
    description:
      "כוסיות אישיות של סלטי שף צבעוניים ורעננים, מוגשות במראה יוקרתי ונקי. כל כוסית משלבת ירקות טריים, טקסטורות עשירות ותיבול מדויק לאירוח קליל ומרשים.",
  },
  {
    name: "מגש כריכוני פרימיום וטורטיות",
    imageFile: "friends.jpg",
    price: 245,
    description:
      "מגש כריכוני פרימיום וטורטיות רכות במילויים עשירים, ירקות פריכים ורטבים איכותיים. פתרון אלגנטי, משביע ומגוון לאירוח עסקי או משפחתי.",
  },
  {
    name: "מגש אנטיפסטי חגיגי וכוסיות פסטה",
    imageFile: "kositpro.jpg",
    price: 220,
    description:
      "אנטיפסטי חגיגי של ירקות קלויים לצד כוסיות פסטה אישיות, מוגשים בשפע ובסטייל מוקפד. שילוב מושלם של צבע, רעננות וטעם איטלקי מעודן.",
  },
  {
    name: "מגש קינוחי פטיפור ומקרונים יוקרתי",
    imageFile: "kosit.jpg",
    price: 275,
    description:
      "מגש קינוחים יוקרתי עם פטיפורים עדינים, מקרונים צבעוניים ומתוקים קטנים שנראים כמו תכשיטים. מתאים לסיום אירוח מרשים עם טאץ׳ אלגנטי במיוחד.",
  },
  {
    name: "מגש קרואסונים וכריכוני בוקר",
    imageFile: "classmorning.jpg",
    price: 198,
    description:
      "מגש בוקר מפנק עם קרואסונים חמאתיים וכריכונים טריים במילויים עשירים. מוגש בשפע, באסתטיקה נקייה ובתחושה של בוקר איכותי בבית קפה.",
  },
  {
    name: "מגש כוסיות סלט קינואה ובריאות",
    imageFile: "kinoa.webp",
    price: 148,
    description:
      "כוסיות סלט קינואה ובריאות עם ירקות טריים, עשבי תיבול ונגיעות פריכות. מנה קלילה, צבעונית ומוקפדת שמתאימה לאירוח מודרני ורענן.",
  },
  {
    name: "מגש אירוח בוקר עשיר ומגוון",
    imageFile: "morningpro.jpg",
    price: 260,
    description:
      "מגש אירוח בוקר רחב ומגוון עם מאפים, כריכונים, ירקות ותוספות מפנקות. מתאים לפתיחת יום חגיגית, ישיבות צוות ואירוח פרימיום מלא שפע.",
  },
];

async function resolveCateringCategory() {
  let category = await Category.findOne({
    $or: [
      { name: CATEGORY_NAME },
      { slug: CATEGORY_SLUG },
      { slug: "serving-trays" },
    ],
  });

  if (category) return category;

  const displayOrder = (await Category.countDocuments()) + 1;
  category = await Category.create({
    name: CATEGORY_NAME,
    slug: CATEGORY_SLUG,
    imageUrl: "/assets/categories/serving-trays.jpg",
    isActive: true,
    displayOrder,
  });

  console.log(`Created category: ${category.name} (${category.slug})`);
  return category;
}

async function seedCateringProducts() {
  await connectDB();

  const cateringCategory = await resolveCateringCategory();
  console.log(
    `Found category: ${cateringCategory.name} (${cateringCategory._id})`
  );

  let inserted = 0;
  let updated = 0;

  for (const item of cateringProducts) {
    const payload = {
      name: item.name,
      description: item.description,
      price: item.price,
      category: cateringCategory._id,
      imageUrl: `/assets/PRODUCTS/${item.imageFile}`,
      status: "available",
      stock: 40,
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

seedCateringProducts().catch((err) => {
  console.error("Catering products seed failed:", err);
  process.exit(1);
});
