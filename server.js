require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/sockets");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

initSocket(server);

async function startServer() {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
