const path = require("path");
const express = require("express");
const morgan = require("morgan");

const routes = require("./routes");
const env = require("./config/env");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", env.clientOrigin);
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Goldie's ordering API is running" });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
